"""Download jktk_x.pt from Hugging Face if missing."""
from pathlib import Path
import sys

try:
    from huggingface_hub import hf_hub_download
except ImportError:
    print("huggingface_hub not installed. Run: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

REPO = "hodoly163/krishibondhu-jktk"
FILE = "jktk_x.pt"
DEST_DIR = Path(__file__).resolve().parent.parent / "models"
DEST = DEST_DIR / FILE

if DEST.exists():
    print(f"Already exists: {DEST} ({DEST.stat().st_size/1e6:.1f} MB)")
    sys.exit(0)

DEST_DIR.mkdir(parents=True, exist_ok=True)
print(f"Downloading {REPO}/{FILE} -> {DEST}")
path = hf_hub_download(repo_id=REPO, filename=FILE, local_dir=str(DEST_DIR))
print(f"Done: {path}")
