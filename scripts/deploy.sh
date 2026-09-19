#!/usr/bin/env bash
# deploy.sh v1 — staged remote-build deploy for oddbackward.
# The build stamp is injected via --build-env BUILD_STAMP=... so a Vercel remote
# build (which cannot see .git) still produces a SHA-pinned stamp. Every
# failure path exits non-zero with a one-line reason so a red gate cannot be
# misread as a retry.

set -euo pipefail

VERSION="deploy.sh v1"
echo "$VERSION"

CLONE_PATH="/Users/timothylum/Desktop/Developer/oddbackward"

# ---------- assertion functions (pure — take observed values as arguments) ----------
# These are shared between the live path (step e) and --selftest, so the same
# code that gates production is exercised by the offline fixtures.

# assert_root_status <status>
# Passes iff the observed root status is exactly 200.
assert_root_status() {
  [ "$1" = "200" ]
}

# assert_missing_status <status>
# Passes iff the observed missing-page status is exactly 404.
assert_missing_status() {
  [ "$1" = "404" ]
}

# assert_stamp_body <html-body> <expected_sha>
# Passes iff <meta name="build-stamp" content="..."> is present, its content
# starts with expected_sha followed by a space, and contains neither "-dirty"
# nor "nogit".
assert_stamp_body() {
  local body="$1"
  local expected_sha="$2"
  local raw stamp
  raw=$(printf '%s' "$body" | grep -o 'name="build-stamp" content="[^"]*"' 2>/dev/null | head -1 || true)
  [ -n "$raw" ] || return 1
  stamp=${raw#name=\"build-stamp\" content=\"}
  stamp=${stamp%\"}
  if printf '%s' "$stamp" | grep -q -- '-dirty'; then return 1; fi
  if printf '%s' "$stamp" | grep -q 'nogit'; then return 1; fi
  case "$stamp" in
    "$expected_sha "*) return 0 ;;
    *) return 1 ;;
  esac
}

# must_pass_aggregate <root_status> <missing_status> <body> <expected_sha>
# The three staged gates as one check — used by the must-pass selftest fixture.
must_pass_aggregate() {
  assert_root_status "$1" || return 1
  assert_missing_status "$2" || return 1
  assert_stamp_body "$3" "$4" || return 1
  return 0
}

# ---------- selftest: offline, no network, no vercel calls ----------
selftest() {
  local all_ok=1
  local expected="abc1234"
  local wrong="deadbee"
  local good_body='<html><head><meta name="build-stamp" content="'"$expected"' 2026-01-01T00:00:00Z"/></head></html>'
  local mismatch_body='<html><head><meta name="build-stamp" content="'"$wrong"' 2026-01-01T00:00:00Z"/></head></html>'
  local dirty_body='<html><head><meta name="build-stamp" content="'"$expected"'-dirty 2026-01-01T00:00:00Z"/></head></html>'
  local nogit_body='<html><head><meta name="build-stamp" content="nogit 2026-01-01T00:00:00Z"/></head></html>'
  local missing_body='<html><head><title>x</title></head></html>'

  run_case() {
    local label="$1"; local want="$2"; shift 2
    if "$@"; then
      if [ "$want" = "pass" ]; then
        echo "  [$label] OK: expected pass, got pass"
      else
        echo "  [$label] BAD: expected fail, got pass"
        all_ok=0
      fi
    else
      if [ "$want" = "fail" ]; then
        echo "  [$label] OK: expected fail, got fail"
      else
        echo "  [$label] BAD: expected pass, got fail"
        all_ok=0
      fi
    fi
  }

  run_case "must-pass (200, 404, matching stamp)" pass must_pass_aggregate "200" "404" "$good_body" "$expected"
  run_case "must-fail root 404"                   fail assert_root_status "404"
  run_case "must-fail root 302"                   fail assert_root_status "302"
  run_case "must-fail missing returns 200"        fail assert_missing_status "200"
  run_case "must-fail SHA mismatch"               fail assert_stamp_body "$mismatch_body" "$expected"
  run_case "must-fail -dirty stamp"               fail assert_stamp_body "$dirty_body"    "$expected"
  run_case "must-fail nogit stamp"                fail assert_stamp_body "$nogit_body"    "$expected"
  run_case "must-fail missing tag"                fail assert_stamp_body "$missing_body"  "$expected"

  echo
  if [ $all_ok -eq 1 ]; then
    echo "RESULT: pass"
    exit 0
  else
    echo "RESULT: fail"
    exit 1
  fi
}

if [ "${1-}" = "--selftest" ]; then
  selftest
fi

# ---------- a. host identity + node version ----------
if [ "${USER-}" != "timothylum" ]; then
  echo "FAIL: USER=${USER-<unset>}, expected timothylum"
  exit 1
fi
if [ "$(pwd)" != "$CLONE_PATH" ]; then
  echo "FAIL: cwd=$(pwd), expected $CLONE_PATH"
  exit 1
fi
node_v=$(node -v)
case "$node_v" in
  v22.*) ;;
  *) echo "FAIL: node=$node_v, expected v22.x"; exit 1 ;;
esac

# ---------- b. clean tree, branch main, HEAD == origin/main after fetch ----------
if [ -n "$(git status --porcelain)" ]; then
  echo "FAIL: working tree is not clean"
  exit 1
fi
branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "main" ]; then
  echo "FAIL: branch=$branch, expected main"
  exit 1
fi
git fetch origin
local_head=$(git rev-parse HEAD)
origin_head=$(git rev-parse origin/main)
if [ "$local_head" != "$origin_head" ]; then
  echo "FAIL: HEAD=$local_head, origin/main=$origin_head — not in sync"
  exit 1
fi

# ---------- c. build stamp injected into the remote build ----------
STAMP="$(git rev-parse --short HEAD) $(date -u +%Y-%m-%dT%H:%M:%SZ)"
HEAD_SHA="$(git rev-parse --short HEAD)"
echo "STAMP: $STAMP"

# ---------- d. staged remote build (no production domain assigned yet) ----------
echo "deploying to Vercel (staged, remote build)..."
URL=$(npx vercel deploy --prod --skip-domain --yes --build-env "BUILD_STAMP=$STAMP" | tail -1)
echo "staged URL: $URL"

# ---------- e. staged checks against the staged URL ----------
fail_staged() {
  echo "STAGED CHECK FAILED, production untouched: $URL — $1"
  exit 1
}

root_status=$(npx vercel curl / --deployment "$URL" -- -s -o /dev/null -w '%{http_code}')
missing_status=$(npx vercel curl /no-such-page-xyz --deployment "$URL" -- -s -o /dev/null -w '%{http_code}')
root_body=$(npx vercel curl / --deployment "$URL" -- -s)

assert_root_status "$root_status" \
  || fail_staged "root / returned $root_status, expected 200"
assert_missing_status "$missing_status" \
  || fail_staged "missing-page /no-such-page-xyz returned $missing_status, expected 404"
assert_stamp_body "$root_body" "$HEAD_SHA" \
  || fail_staged "root body build-stamp does not start with '$HEAD_SHA ', or contains -dirty/nogit, or the meta tag is missing"

# ---------- f. promote staged URL to production ----------
echo "promoting $URL to production..."
npx vercel promote "$URL" --yes

# ---------- g. verify-stamp against production; its exit code is this script's exit code ----------
bash scripts/verify-stamp.sh
