"""Stand-in validator that rejects every file. Used only to test the harness."""

import sys

print("day-01.yaml: exercise ex_1 has no correct answer", file=sys.stderr)
sys.exit(1)
