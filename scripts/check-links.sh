#!/usr/bin/env bash
# check-links.sh v1 — 2026-11-16
# Every outbound link the page ships must answer 200. The link set is every
# distinct http:// or https:// href inside an <a ...> tag (<link> tags and
# mailto: are outside it). Each link gets a GET that follows redirects, 15s cap,
# up to two attempts; it passes only when the final status is exactly 200. An
# empty link set is a fail: a page with no outbound links means the extractor
# or the page is broken.
#
#   bash scripts/check-links.sh <page-url>   fetch the page, then check its links
#   bash scripts/check-links.sh --stdin      read the page HTML from stdin
#   bash scripts/check-links.sh --selftest   offline fixtures, no network
#
# The extractor, the verdict and the loop are pure functions that take the HTML
# and the name of a fetcher function. The live path passes curl_fetch; the
# selftest passes stubs. The same code judges both.
#
# Note: intentionally no `set -e` — every command whose failure is meaningful
# is checked explicitly.

VERSION="check-links.sh v1"
echo "$VERSION"

set -u

usage() {
  echo "usage: bash scripts/check-links.sh <page-url> | --stdin | --selftest" >&2
  exit 2
}

# ---------- pure functions ----------

# extract_links <html>
# Prints each distinct http(s) href found inside an <a ...> tag, one per line,
# in first-seen order. Newlines are flattened first so a tag split across lines
# is still seen. Double-quoted, single-quoted and unquoted values are read;
# &amp; is decoded so the URL fetched is the URL the browser follows.
extract_links() {
  printf '%s' "$1" \
    | tr '\r\n' '  ' \
    | grep -oiE '<a[[:space:]][^>]*>' \
    | grep -oiE "[[:space:]]href[[:space:]]*=[[:space:]]*(\"[^\"]*\"|'[^']*'|[^\"'[:space:]>]+)" \
    | sed -E "s/^[^=]*=[[:space:]]*//; s/^[\"']//; s/[\"']\$//" \
    | sed 's/&amp;/\&/g' \
    | grep -iE '^https?://' \
    | awk '!seen[$0]++'
}

# link_verdict <status>
# Passes iff the final status is exactly 200.
link_verdict() {
  [ "$1" = "200" ]
}

# check_links <html> <fetcher>
# <fetcher> is the name of a function called as `<fetcher> <url> <attempt>`
# that prints the final HTTP status (000 = no response). Prints one line per
# link and a summary line; sets LINKS_CHECKED and LINKS_FAILED. Returns 0 iff
# at least one link was found and every link passed.
LINKS_CHECKED=0
LINKS_FAILED=0
check_links() {
  local html="$1" fetcher="$2"
  local links url attempt status
  LINKS_CHECKED=0
  LINKS_FAILED=0
  links=$(extract_links "$html")
  while IFS= read -r url; do
    [ -n "$url" ] || continue
    LINKS_CHECKED=$((LINKS_CHECKED + 1))
    status=""
    for attempt in 1 2; do
      status=$("$fetcher" "$url" "$attempt")
      [ -n "$status" ] || status="000"
      if link_verdict "$status"; then break; fi
    done
    if link_verdict "$status"; then
      echo "OK $status $url"
    else
      echo "FAIL $status $url"
      LINKS_FAILED=$((LINKS_FAILED + 1))
    fi
  done <<EOF
$links
EOF
  echo "checked $LINKS_CHECKED links, $LINKS_FAILED failed"
  if [ "$LINKS_CHECKED" -eq 0 ]; then
    echo "FAIL: no outbound links found — the extractor or the page is broken"
    return 1
  fi
  [ "$LINKS_FAILED" -eq 0 ]
}

# ---------- live fetcher ----------

# curl_fetch <url> <attempt>
# GET, follow redirects, 15s cap. Prints the final status; 000 when curl got
# no response.
curl_fetch() {
  local code
  code=$(curl -s -L -o /dev/null --max-time 15 -w '%{http_code}' "$1" 2>/dev/null)
  printf '%s' "${code:-000}"
}

# ---------- selftest: offline, stub fetchers only ----------
selftest() {
  local tmp all_ok=1
  tmp=$(mktemp -d 2>/dev/null || mktemp -d -t check-links)
  # shellcheck disable=SC2064
  trap "rm -rf '$tmp'" EXIT
  FETCH_LOG="$tmp/fetches"

  # stub_fetch <url> <attempt>: status chosen by host, every call logged.
  stub_fetch() {
    echo "$1" >> "$FETCH_LOG"
    case "$1" in
      *ok.test*)   printf '200' ;;
      *s404.test*) printf '404' ;;
      *s500.test*) printf '500' ;;
      *s403.test*) printf '403' ;;
      *s301.test*) printf '301' ;;
      *dead.test*) printf '000' ;;
      *flaky.test*) if [ "$2" = "1" ]; then printf '000'; else printf '200'; fi ;;
      *) printf '000' ;;
    esac
  }

  # run_case <label> <want pass|fail> <html> [expected_N] [expected_fetches] [expected_fetched_url]
  run_case() {
    local label="$1" want="$2" html="$3" want_n="${4-}" want_fetches="${5-}" want_url="${6-}"
    local got fetches
    : > "$FETCH_LOG"
    if check_links "$html" stub_fetch > "$tmp/out"; then got=pass; else got=fail; fi
    sed 's/^/      /' "$tmp/out"
    fetches=$(wc -l < "$FETCH_LOG" | tr -d ' ')
    if [ "$got" != "$want" ]; then
      echo "  [$label] BAD: expected $want, got $got"
      all_ok=0
    elif [ -n "$want_n" ] && [ "$LINKS_CHECKED" != "$want_n" ]; then
      echo "  [$label] BAD: expected N=$want_n, got N=$LINKS_CHECKED"
      all_ok=0
    elif [ -n "$want_fetches" ] && [ "$fetches" != "$want_fetches" ]; then
      echo "  [$label] BAD: expected $want_fetches fetch(es), got $fetches"
      all_ok=0
    elif [ -n "$want_url" ] && ! grep -qxF -- "$want_url" "$FETCH_LOG"; then
      echo "  [$label] BAD: fetch log does not hold $want_url"
      all_ok=0
    else
      echo "  [$label] OK: expected $want, got $got${want_n:+, N=$LINKS_CHECKED}${want_fetches:+, fetches=$fetches}"
    fi
  }

  local all_ok_html='<html><body><a href="https://ok.test/a">a</a>
<a class="x"
   href="https://ok.test/b" target="_blank">b</a></body></html>'
  local excluded_html='<html><head><link rel="canonical" href="https://s404.test/"/></head><body>
<a href="https://ok.test/a">a</a><a href="mailto:me@s404.test">mail</a><a href="https://ok.test/b">b</a></body></html>'
  local repeated_html='<a href="https://ok.test/same">1</a><a href="https://ok.test/same">2</a><a href="https://ok.test/same">3</a>'
  local forms_html='<a href='"'"'https://ok.test/single'"'"'>s</a><a href=https://ok.test/unquoted>u</a><a href="https://ok.test/q?a=1&amp;b=2">d</a>'
  local flaky_html='<a href="https://ok.test/a">a</a><a href="https://flaky.test/">f</a>'
  local s404_html='<a href="https://ok.test/a">a</a><a href="https://s404.test/">x</a>'
  local s500_html='<a href="https://ok.test/a">a</a><a href="https://s500.test/">x</a>'
  local s403_html='<a href="https://ok.test/a">a</a><a href="https://s403.test/">x</a>'
  local s301_html='<a href="https://ok.test/a">a</a><a href="https://s301.test/">x</a>'
  local dead_html='<a href="https://ok.test/a">a</a><a href="https://dead.test/">x</a>'
  local none_html='<html><head><link rel="canonical" href="https://ok.test/"/></head><body><a href="mailto:me@ok.test">mail</a><a href="/about">rel</a></body></html>'

  run_case "must-pass every link 200"                       pass "$all_ok_html"  2
  run_case "must-pass <link> and mailto: 404 outside set"   pass "$excluded_html" 2
  run_case "must-pass one URL in three anchors fetched once" pass "$repeated_html" 1 1
  run_case "must-pass no response then 200 on retry"        pass "$flaky_html"   "" 3
  run_case "must-pass single-quoted, unquoted, &amp; decoded" pass "$forms_html" 3 "" "https://ok.test/q?a=1&b=2"
  run_case "must-fail one link 404"                         fail "$s404_html"
  run_case "must-fail one link 500"                         fail "$s500_html"
  run_case "must-fail one link 403"                         fail "$s403_html"
  run_case "must-fail final status 301"                     fail "$s301_html"
  run_case "must-fail no response on both attempts"         fail "$dead_html"
  run_case "must-fail no outbound anchors"                  fail "$none_html"

  echo
  if [ $all_ok -eq 1 ]; then
    echo "RESULT: pass"
    exit 0
  else
    echo "RESULT: fail — a must-pass fixture failed OR a must-fail fixture was not caught"
    exit 1
  fi
}

# ---------- entry ----------
[ $# -eq 1 ] || usage

case "$1" in
  --selftest)
    selftest
    ;;
  --stdin)
    html=$(cat)
    ;;
  http://*|https://*)
    html=$(curl -sSfL --max-time 15 "$1")
    rc=$?
    if [ $rc -ne 0 ]; then
      echo "FAIL: could not fetch $1 (curl exit $rc)"
      echo "RESULT: fail"
      exit 1
    fi
    ;;
  *)
    usage
    ;;
esac

if check_links "$html" curl_fetch; then
  echo "RESULT: pass"
  exit 0
fi
echo "RESULT: fail"
exit 1
