# Vision Model

`jktk_x.pt` (YOLO, 116 classes, ~436 MB) is **not** tracked in git (`.gitignore` + GitHub 100 MB limit).

## Download

Hosted on Hugging Face: `hodoly163/krishibondhu-jktk`

```bash
# via helper script
python scripts/download_model.py

# or direct hf CLI
hf download hodoly163/krishibondhu-jktk jktk_x.pt --local-dir models --local-dir-use-symlinks False

# or Python API
python -c "from huggingface_hub import hf_hub_download; hf_hub_download('hodoly163/krishibondhu-jktk','jktk_x.pt',local_dir='models')"
```

Place file as `KrishiBondhuVision/models/jktk_x.pt`. Server (`api/server.py:22`) tries HF download at startup if missing, otherwise expects local file.

## Upload (maintainers)

```bash
hf auth login
hf upload hodoly163/krishibondhu-jktk models/jktk_x.pt jktk_x.pt --repo-type model
```
