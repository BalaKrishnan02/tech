import sys
from pathlib import Path
import uvicorn

# Ensure repository root is on sys.path so 'backend.app...' imports resolve cleanly
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
