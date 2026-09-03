import re
import sys
from pathlib import Path

import numpy as np
from ultralytics import YOLO

ROOT = Path(__file__).resolve().parent.parent
EVAL = ROOT / "test_images" / "eval"
MODEL = ROOT / "models" / "jktk_x.pt"

# expected label (normalized) -> accepted model classes (normalized)
EXPECT = {
    "banana sigatoka": None,  # model has no sigatoka class (coverage gap)
    "cassava mosaic": {"cassava mosaic"},
    "corn blight": {"corn northern leaf blight", "corn leaf blight"},
    "corn rust": {"corn rust", "corn rust leaf"},
    "corn gray leaf spot": {"corn gray leaf spot"},
    "corn healthy": {"corn healthy", "corn leaf"},
    "grape downy mildew": {"grape downy mildew"},
    "potato late blight": {"potato late blight", "tomato late blight"},
}

THRESHOLDS = [0.1, 0.25, 0.5]


def label_of(name: str) -> str:
    stem = name.split(".")[0]
    if "__" in stem:
        stem = stem.split("__")[0]
    else:
        stem = re.sub(r"_\d+$", "", stem)
    return stem.replace("_", " ").lower()


def main():
    model = YOLO(str(MODEL))
    names = {k.lower(): v for k, v in model.names.items()}
    imgs = sorted(EVAL.glob("*.jpg"))
    if not imgs:
        print("no eval images")
        sys.exit(1)

    rows = []  # (name, expected, predicted, conf, correct)
    for p in imgs:
        exp = label_of(p.name)
        res = model.predict(str(p), conf=THRESHOLDS[1], imgsz=640, verbose=False)[0]
        if len(res.boxes):
            i = int(res.boxes.cls[0].item())
            pred, conf = names[model.names[i].lower()], float(res.boxes.conf[0].item())
        else:
            pred, conf = "NO DETECTION", 0.0
        ok = None
        if EXPECT[exp] is None:
            ok = None  # coverage gap, excluded
        else:
            ok = pred.lower() in EXPECT[exp]
        rows.append((p.name, exp, pred, conf, ok))

    include = [r for r in rows if r[4] is not None]
    right = sum(1 for r in include if r[4])
    print(f"images evaluated: {len(include)}/37  (excluded: {len(rows) - len(include)} no-model-class)")
    print(f"ACCURACY @ conf=0.25: {right}/{len(include)} = {right / len(include) * 100:.1f}%\n")

    print("per-image (expected -> predicted [conf])")
    for name, exp, pred, conf, ok in rows:
        mark = {True: "OK ", False: "xx "}.get(ok, "-- ")
        print(f"  {mark}{name:<28} {exp:<22}-> {pred:<26} {conf:.2f}")

    per_class = {}
    for r in include:
        per_class.setdefault(r[1], [0, 0])
        per_class[r[1]][0] += 1
        per_class[r[1]][1] += int(r[4])
    print("\nper-class (correct/total)")
    for cls, (tot, cor) in sorted(per_class.items()):
        print(f"  {cls:<22} {cor}/{tot} = {cor / tot * 100:.0f}%")

    print("\nconfidence sweep (top-1 accuracy)")
    for thr in THRESHOLDS:
        hits = total = 0
        for p in imgs:
            exp = label_of(p.name)
            if EXPECT[exp] is None:
                continue
            res = model.predict(str(p), conf=thr, imgsz=640, verbose=False)[0]
            if not len(res.boxes):
                continue
            i = int(res.boxes.cls[0].item())
            pred = names[model.names[i].lower()]
            total += 1
            hits += int(pred.lower() in EXPECT[exp])
        print(f"  conf={thr:.2f}: {hits}/{total} = {hits / total * 100:.1f}%")


if __name__ == "__main__":
    main()