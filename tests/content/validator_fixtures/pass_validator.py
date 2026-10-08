"""Stand-in validator that accepts every file. Used only to test the harness."""

import sys
from pathlib import Path

target = Path(sys.argv[1])
files = sorted(target.rglob("*.yaml"))
print(f"validated {len(files)} file(s) under {target.name}")
