#!/usr/bin/env bash
# End-to-end test: exercises init, sync, log, and promote in a temp project
# and asserts on the files they produce.
set -euo pipefail

CHARTER="$(cd "$(dirname "$0")/.." && pwd)/bin/charter.js"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cd "$WORK"

pass=0
check() { # check <description> <command...>
  local desc="$1"; shift
  if "$@" > /dev/null 2>&1; then
    pass=$((pass + 1))
    echo "ok   $desc"
  else
    echo "FAIL $desc" >&2
    exit 1
  fi
}
expect_fail() { # expect_fail <description> <command...>
  local desc="$1"; shift
  if "$@" > /dev/null 2>&1; then
    echo "FAIL $desc (expected nonzero exit)" >&2
    exit 1
  else
    pass=$((pass + 1))
    echo "ok   $desc"
  fi
}

# --- init ---
check "init scaffolds charters/"        node "$CHARTER" init
check "schema created"                  test -f charters/SCHEMA.md
check "template created"                test -f charters/TEMPLATE.md
check "decision log created"            test -f charters/decisions.md
check "CLAUDE.md created with markers"  grep -q 'charter:begin' CLAUDE.md
check "init is idempotent"              node "$CHARTER" init

# --- sync with a real charter ---
sed 's/^charter: replace-me/charter: engineering/' charters/TEMPLATE.md > charters/engineering.md
check "sync succeeds"                   node "$CHARTER" sync
check "charter rendered into CLAUDE.md" grep -q '## engineering' CLAUDE.md

# --- sync preserves hand-written content ---
printf '# Hand-written notes\n' > CLAUDE.md
check "sync appends to existing file"   node "$CHARTER" sync
check "hand-written content preserved"  grep -q 'Hand-written notes' CLAUDE.md
check "sync again replaces in place"    node "$CHARTER" sync
check "exactly one begin marker"        test "$(grep -c 'charter:begin' CLAUDE.md)" = 1

# --- log ---
check "log records a decision"          node "$CHARTER" log "Use a single storage module" --charter engineering
check "log entry has an id"             grep -q '## D-0001' charters/decisions.md
check "log entry starts open"           grep -q 'status: open' charters/decisions.md
expect_fail "log rejects unknown charter" node "$CHARTER" log "orphan" --charter nope
expect_fail "log requires --charter"      node "$CHARTER" log "no charter given"

# --- promote ---
check "promote succeeds"                node "$CHARTER" promote D-0001
check "constraint added to charter"     grep -q 'Use a single storage module' charters/engineering.md
check "version bumped"                  grep -q 'version: 2' charters/engineering.md
check "log entry marked promoted"       grep -q 'status: promoted' charters/decisions.md
check "constraint reached CLAUDE.md"    grep -q 'Use a single storage module' CLAUDE.md
expect_fail "promote rejects re-promotion" node "$CHARTER" promote D-0001
expect_fail "promote rejects unknown id"   node "$CHARTER" promote D-9999

# --- guardrails ---
EMPTY="$(mktemp -d)"
sync_before_init() { (cd "$EMPTY" && node "$CHARTER" sync); }
expect_fail "sync fails before init"    sync_before_init
rm -rf "$EMPTY"

echo
echo "all $pass checks passed"
