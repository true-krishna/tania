#!/bin/sh
# SDL drift guard (TAN-213): fail when the frontend copies of the GraphQL
# schema drift from the SDL that the backend actually serves.
#
# The served schema, `tania-backend/graph/schema.graphqls`, is the single
# source of truth (constitution 1.1.1). This script compares it byte-for-byte
# against every copy this repo consumes:
#
#   1. graph/schema.graphqls                                                 (codegen source)
#   2. specs/001-employee-digital-talent-management/contracts/schema.graphql (contract mirror)
#   3. the backend repo's own copy of the contract mirror
#
# Usage:
#   sh scripts/check-schema-drift.sh [path-to-tania-backend]
#   TANIA_BACKEND_DIR=/path/to/tania-backend sh scripts/check-schema-drift.sh
#
# The backend checkout defaults to a sibling directory of this repo. A missing
# backend checkout is a hard failure, never a silent pass.
#
# Exit codes: 0 = all copies match the served SDL; 1 = drift or missing input.

set -u

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
backend_dir="${TANIA_BACKEND_DIR:-$root/../tania-backend}"
if [ $# -ge 1 ]; then
  backend_dir=$1
fi

served=$backend_dir/graph/schema.graphqls
if [ ! -f "$served" ]; then
  echo "schema-drift: served SDL not found at $served" >&2
  echo "  pass the tania-backend checkout path as an argument or set TANIA_BACKEND_DIR" >&2
  exit 1
fi

mirror_rel=specs/001-employee-digital-talent-management/contracts/schema.graphql
status=0

compare() {
  label=$1
  path=$2
  if [ ! -f "$path" ]; then
    echo "schema-drift: MISSING $label ($path)" >&2
    status=1
    return
  fi
  if cmp -s "$served" "$path"; then
    echo "schema-drift: OK      $label"
  else
    echo "schema-drift: DRIFT   $label ($path)" >&2
    diff -u "$served" "$path" | head -40 >&2
    status=1
  fi
}

compare "graph/schema.graphqls (codegen source)" "$root/graph/schema.graphqls"
compare "contract mirror (this repo)" "$root/$mirror_rel"
compare "contract mirror (tania-backend)" "$backend_dir/$mirror_rel"

if [ "$status" -eq 0 ]; then
  echo "schema-drift: all copies match the served SDL (sha256 $(sha256sum "$served" | awk '{print $1}'))"
else
  echo "schema-drift: re-copy the served SDL over the drifted copies, then regenerate (README: GraphQL codegen)" >&2
fi
exit $status
