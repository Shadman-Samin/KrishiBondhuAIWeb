# Detection eval — measured result

Command:

```bash
KrishiBondhuVision/.venv/Scripts/python.exe KrishiBondhuVision/scripts/eval_accuracy.py
```

Model: `KrishiBondhuVision/models/jktk_x.pt` (KrishiDrishti-11X, 116 classes).
Test set: `KrishiBondhuVision/test_images/eval` — 37 images, 36 evaluable
(banana sigatoka excluded: the model has no sigatoka class).

## Result — 2026-10-20

```
images evaluated: 36/37  (excluded: 1 no-model-class)
ACCURACY @ conf=0.25: 22/36 = 61.1%
```

Per class (correct/total):

| Class | Correct / total | Accuracy |
|---|---|---|
| cassava mosaic | 0 / 1 | 0% |
| corn blight | 2 / 8 | 25% |
| corn gray leaf spot | 6 / 8 | 75% |
| corn healthy | 5 / 8 | 62% |
| corn rust | 6 / 8 | 75% |
| grape downy mildew | 1 / 1 | 100% |
| potato late blight | 2 / 2 | 100% |

Confidence sweep: `conf=0.10 → 22/36`, `conf=0.25 → 22/36`,
`conf=0.50 → 21/33` (36.4% of the set was corn; images are web-sourced,
not field photos).

## What this number is / is not

- It is **top-1 image-level accuracy** at `conf=0.25`: the highest-confidence
  detection is compared with the expected class (or an accepted synonym).
- It is **not** field accuracy and **not** mAP. The model card separately
  publishes the training/validation object-detection metrics
  (mAP@50 0.699, mAP@50-95 0.686) recorded in the checkpoint.
- The test set is small, corn-heavy, and web-sourced. Do not generalize the
  percentage to every crop or every field photo.
- Known gap: no banana sigatoka class; that image is excluded explicitly.

## Why this file exists

The public landing page previously showed `Detection Accuracy 95%`, which had no
eval behind it. It has been removed. Any public accuracy claim must cite this
file (or a newer run of the same script), not a rounded-up number.
