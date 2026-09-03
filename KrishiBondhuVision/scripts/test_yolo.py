import sys
from pathlib import Path

from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "models" / "peach_better.pt"
SRC_DIRS = [ROOT / "test_images" / "mine", ROOT / "test_images" / "yours"]
OUT = ROOT / "test_images" / "annotated"
OUT.mkdir(parents=True, exist_ok=True)


def main():
    which = sys.argv[1:] or ["mine", "yours"]
    model = YOLO(str(MODEL))
    names = model.names

    for folder in SRC_DIRS:
        if folder.name not in which or not folder.is_dir():
            continue
        imgs = sorted(folder.glob("*"))
        if not imgs:
            print(f"[{folder.name}] no images")
            continue
        print(f"=== {folder.name} ===")
        for p in imgs:
            if p.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp", ".bmp"):
                continue
            res = model.predict(str(p), conf=0.25, imgsz=640, verbose=False)[0]
            print(f"\n{p.name}  ({len(res.boxes)} detections)")
            for box, cls, cf in zip(res.boxes.xyxy, res.boxes.cls, res.boxes.conf):
                x1, y1, x2, y2 = (round(v, 0) for v in box.tolist())
                print(f"    {cf.item()*100:5.2f}%  {names[int(cls)]:<28} box=({x1:.0f},{y1:.0f},{x2:.0f},{y2:.0f})")
            res.save(filename=str(OUT / f"{folder.name}__{p.name}"))


if __name__ == "__main__":
    main()