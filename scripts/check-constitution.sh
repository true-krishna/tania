#!/bin/sh
# Constitution guard: fail when unresolved merge-conflict markers remain in
# the constitution documents.
#
# Background (2026-10-14 governance repair): a parallel amendment line merged
# its log block into the design constitution with conflict markers unresolved
# (`<<<<<<< HEAD` / `=======` / `>>>>>>> ...`), and that state reached master.
# The guard makes that failure mode impossible to re-enter silently.
#
# Run locally before pushing a constitution change; wire into CI as a
# `test`-stage job once the pipeline configuration lands.
#
# Usage: scripts/check-constitution.sh
set -e
status=0
for f in $(find docs/constitution .specify/memory -name 'constitution*.md' ! -name '.constitution-template*' 2>/dev/null); do
  if grep -qE '^(<<<<<<< |>>>>>>> )' "$f"; then
    echo "FAIL: unresolved conflict markers in $f"
    grep -nE '^(<<<<<<< |>>>>>>> )' "$f"
    status=1
  else
    echo "OK: $f"
  fi
done
if [ "$status" -eq 0 ]; then
  echo "All constitution files clean."
fi
exit "$status"