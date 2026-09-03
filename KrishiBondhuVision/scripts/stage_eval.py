import random
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EVAL = ROOT / "test_images" / "eval"
ZIP = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(r"C:\Users\PC\AppData\Local\Temp\opencode\corn.zip")

CLASSES = {
    "Blight": "corn_blight",
    "Common_Rust": "corn_rust",
    "Gray_Leaf_Spot": "corn_gray_leaf_spot",
    "Healthy": "corn_healthy",
}
PER_CLASS = 8

rng = random.Random(42)
EVAL.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(ZIP) as z:
    members = z.namelist()
    for folder, label in CLASSES.items():
        imgs = [m for m in members if m.startswith(f"data/{folder}/") and m.lower().endswith((".jpg", ".jpeg"))]
        imgs.sort()
        picked = rng.sample(imgs, min(PER_CLASS, len(imgs)))
        for i, m in enumerate(picked, 1):
            dest = EVAL / f"{label}__{i:02d}.jpg"
            if not dest.exists():
                with z.open(m) as src, open(dest, "wb") as out:
                    shutil.copyfileobj(src, out)
            print(f"[+] {dest.name}")

print(f"\ntotal eval images: {len(list(EVAL.glob('*.jpg')))}")