#!/usr/bin/env bash
# verify-stamp.sh v1 — 2026-08-17
# Compare the deployed page's <meta name="build-stamp"> against local git HEAD.
# Fails loudly on: unreachable URL, missing meta tag, SHA mismatch, or -dirty
# marker in the deployed stamp. `--selftest` proves each failure mode fires.
#
# Note: intentionally does NOT use `set -e` inside AND-OR lists — every command
# whose failure is meaningful captures `rc=$?` and branches on it.

VERSION="verify-stamp.sh v1"
echo "$VERSION"

set -u

DEFAULT_URL="https://oddbackward.forpono.com"

# ---------- extraction + comparison ----------
# check_stamp_html <label> <html> <expected_sha>
# Prints a one-line result. Returns 0 iff every gate is satisfied:
#   - tag present, SHA equals expected, no -dirty marker.
check_stamp_html() {
  local label="$1"
  local html="$2"
  local expected_sha="$3"

  local raw stamp deployed_sha
  raw=$(printf '%s' "$html" | grep -o 'name="build-stamp" content="[^"]*"' | head -1)
  if [ -z "$raw" ]; then
    echo "  [$label] FAIL: no <meta name=\"build-stamp\"> tag found"
    return 1
  fi

  stamp=${raw#name=\"build-stamp\" content=\"}
  stamp=${stamp%\"}

  if printf '%s' "$stamp" | grep -q -- '-dirty'; then
    echo "  [$label] FAIL: deployed stamp is -dirty (built from an unclean tree): $stamp"
    return 1
  fi

  deployed_sha=$(printf '%s' "$stamp" | awk '{print $1}')
  if [ "$deployed_sha" != "$expected_sha" ]; then
    echo "  [$label] FAIL: SHA mismatch — deployed=$deployed_sha local=$expected_sha (full stamp: $stamp)"
    return 1
  fi

  echo "  [$label] OK: stamp=\"$stamp\" (SHA matches local HEAD)"
  return 0
}

# ---------- selftest: prove each failure mode fires ----------
selftest() {
  local tmp all_ok=1
  tmp=$(mktemp -d 2>/dev/null || mktemp -d -t verify-stamp)
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" EXIT

  local expected="abc1234"
  local wrong="deadbee"

  # must-pass: matching SHA, clean stamp, tag present
  printf '<html><head><meta name="build-stamp" content="%s 2026-08-17T00:00:00.000Z"/></head><body></body></html>\n' \
    "$expected" > "$tmp/good.html"
  # must-fail: no meta tag at all
  printf '<html><head><title>x</title></head><body></body></html>\n' > "$tmp/missing.html"
  # must-fail: SHA does not match local HEAD
  printf '<html><head><meta name="build-stamp" content="%s 2026-08-17T00:00:00.000Z"/></head><body></body></html>\n' \
    "$wrong" > "$tmp/mismatch.html"
  # must-fail: -dirty marker on an otherwise-matching SHA
  printf '<html><head><meta name="build-stamp" content="%s-dirty 2026-08-17T00:00:00.000Z"/></head><body></body></html>\n' \
    "$expected" > "$tmp/dirty.html"

  # ----- must-pass: gate MUST allow -----
  local rc html
  html=$(cat "$tmp/good.html")
  check_stamp_html "must-pass good" "$html" "$expected"
  rc=$?
  if [ $rc -eq 0 ]; then
    echo "  => must-pass good: PASSED (as required)"
  else
    echo "  => must-pass good: FAILED (gate is over-eager — allowed nothing to pass)"
    all_ok=0
  fi

  # ----- must-fail: missing meta tag -----
  html=$(cat "$tmp/missing.html")
  check_stamp_html "must-fail missing-tag" "$html" "$expected"
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "  => must-fail missing-tag: FAILED (as required — gate caught it)"
  else
    echo "  => must-fail missing-tag: PASSED (gate did NOT catch it — this is the defect this exists to close)"
    all_ok=0
  fi

  # ----- must-fail: SHA mismatch -----
  html=$(cat "$tmp/mismatch.html")
  check_stamp_html "must-fail sha-mismatch" "$html" "$expected"
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "  => must-fail sha-mismatch: FAILED (as required — gate caught it)"
  else
    echo "  => must-fail sha-mismatch: PASSED (gate did NOT catch it — this is the defect this exists to close)"
    all_ok=0
  fi

  # ----- must-fail: -dirty marker -----
  html=$(cat "$tmp/dirty.html")
  check_stamp_html "must-fail dirty-marker" "$html" "$expected"
  rc=$?
  if [ $rc -ne 0 ]; then
    echo "  => must-fail dirty-marker: FAILED (as required — gate caught it)"
  else
    echo "  => must-fail dirty-marker: PASSED (gate did NOT catch it — this is the defect this exists to close)"
    all_ok=0
  fi

  echo
  if [ $all_ok -eq 1 ]; then
    echo "RESULT: pass"
    exit 0
  else
    echo "RESULT: fail — a must-pass fixture failed OR a must-fail fixture was not caught"
    exit 1
  fi
}

# ---------- live mode ----------
if [ "${1-}" = "--selftest" ]; then
  selftest
fi

target="${1:-$DEFAULT_URL}"

local_sha=$(git rev-parse --short HEAD 2>/dev/null)
rc=$?
if [ $rc -ne 0 ] || [ -z "$local_sha" ]; then
  echo "FAIL: cannot read local git HEAD (git rev-parse --short HEAD failed with rc=$rc)"
  echo "RESULT: fail"
  exit 2
fi
echo "Target:    $target"
echo "Local HEAD: $local_sha"

body=$(curl -sSfL --max-time 20 "$target")
rc=$?
if [ $rc -ne 0 ]; then
  echo "FAIL: could not fetch $target (curl exit $rc) — unreachable is a hard fail, never a skip"
  echo "RESULT: fail"
  exit 3
fi

check_stamp_html "deployed" "$body" "$local_sha"
rc=$?
if [ $rc -ne 0 ]; then
  echo "RESULT: fail"
  exit 1
fi

echo "RESULT: pass"
exit 0
