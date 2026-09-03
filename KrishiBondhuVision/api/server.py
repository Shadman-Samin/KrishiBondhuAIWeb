import io
import json
import os
from datetime import date
from pathlib import Path
from urllib.request import Request as UrlRequest, urlopen

from dotenv import load_dotenv
from fastapi import FastAPI, Body, File, UploadFile
from fastapi import Request as HttpRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response, StreamingResponse
from starlette.middleware.gzip import GZipMiddleware
from PIL import Image
from numpy import asarray
from ultralytics import YOLO

from . import market

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
MODEL_PATH = ROOT / "models" / "jktk_x.pt"
WEB_DIST = ROOT.parent / "KrishiBondhuWeb" / "dist" / "client"
APP_SERVER_URL = "http://127.0.0.1:8001"
CONF = 0.25
IMSZ = 640

ADVISE_URL = os.environ.get("ADVISE_URL", "http://127.0.0.1:1234/v1")
ADVISE_MODEL = os.environ.get("ADVISE_MODEL", "qwen3.5-4b-uncensored-hauhaucs-aggressive")
HF_MODEL_REPO = os.environ.get("HF_MODEL_REPO", "hodoly163/krishibondhu-jktk")
HF_MODEL_FILE = os.environ.get("HF_MODEL_FILE", "jktk_x.pt")

# Auto-fetch model from Hugging Face if not locally present
if not MODEL_PATH.exists():
    try:
        from huggingface_hub import hf_hub_download

        print(f"Model not found at {MODEL_PATH}, downloading from HF {HF_MODEL_REPO}/{HF_MODEL_FILE} ...")
        hf_hub_download(
            repo_id=HF_MODEL_REPO, filename=HF_MODEL_FILE, local_dir=str(MODEL_PATH.parent)
        )
    except Exception as e:
        print(f"HF model download failed: {e}")

model = YOLO(str(MODEL_PATH))

app = FastAPI(title="KrishiBondhu Disease Detection")

app.add_middleware(
    GZipMiddleware,
    minimum_size=500,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_PATH.name, "classes": len(model.names)}


@app.get("/market-prices")
def market_prices():
    rows, _ = market.get_prices()
    return Response(
        json.dumps(
            {"updated_at": date.today().isoformat(), "sources": ["dam"] if rows else [], "rows": rows},
            ensure_ascii=False,
        ),
        media_type="application/json",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@app.get("/market-prices/history")
def market_price_history(crop: str, days: int = 30):
    return Response(
        json.dumps({"crop": crop, "points": market.get_history(crop, days)}, ensure_ascii=False),
        media_type="application/json",
        headers={"Cache-Control": "public, max-age=3600"},
    )


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    img = Image.open(io.BytesIO(data)).convert("RGB")
    res = model.predict(asarray(img), conf=CONF, imgsz=IMSZ, verbose=False)[0]

    detections = []
    for box, cls, conf in zip(res.boxes.xyxy.tolist(), res.boxes.cls.tolist(), res.boxes.conf.tolist()):
        detections.append(
            {
                "class": model.names[int(cls)],
                "conf": round(conf, 4),
                "box": [round(v, 1) for v in box],
            }
        )
    detections.sort(key=lambda d: d["conf"], reverse=True)

    top = detections[0] if detections else None
    return {"detections": detections, "top": top}


def _chat(messages, temperature=0.3, max_tokens=1024):
    req = UrlRequest(
        f"{ADVISE_URL}/chat/completions",
        data=json.dumps(
            {
                "model": ADVISE_MODEL,
                "messages": messages + [{"role": "assistant", "content": "</think>"}],
                "temperature": temperature,
                "max_tokens": max_tokens,
                "continue_assistant_turn": True,
            }
        ).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urlopen(req, timeout=120) as res:
        return json.loads(res.read())


def _parse_advice(text):
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text[text.find("\n") + 1 :]
    return json.loads(text)


@app.post("/advise")
def advise(payload: dict = Body(...)):
    try:
        detections = [d for d in payload.get("detections", []) if d][:3]
        top = payload.get("top")
        disease = payload.get("disease")

        sys_msg = (
            "You are an agricultural extension agent for farmers in Bangladesh. "
            "A vision model detected the following on a crop photo:\n"
            f"{json.dumps({'top': top, 'detections': detections}, ensure_ascii=False)}\n\n"
            f"Matched disease knowledge card:\n{json.dumps(disease, ensure_ascii=False) if disease else 'None'}\n\n"
            "Write ONE short status line plus 2-3 clear action steps in plain farmer-friendly language. "
            "Reply with ONLY a JSON object of exactly this shape, no markdown fences, no extra text:\n"
            '{"en": "english status and actions", "bn": "same text in Bangla"}'
        )
        reply = _chat(
            [
                {"role": "system", "content": sys_msg},
                {"role": "user", "content": "Give the status and what to do, in both English and Bengali."},
            ]
        )
        data = _parse_advice(reply["choices"][0]["message"]["content"])
        en, bn = str(data["en"]).strip(), str(data["bn"]).strip()
        return {"advice": {"en": en, "bn": bn}} if en and bn else {"advice": None}
    except Exception:
        return {"advice": None}


CHAT_MAX_MESSAGES = 12  # ponytail: cap history to keep local 4b model fast


def _chat_messages(payload: dict):
    messages = payload.get("messages", []) or []
    lang = str(payload.get("lang") or "en")
    context = payload.get("context") or {}

    valid = [m for m in messages if m.get("role") in ("user", "assistant") and m.get("content")][-CHAT_MAX_MESSAGES:]

    lang_label = "Bengali" if lang == "bn" else "English"
    sys_msg = (
        "You are KrishiBondhu AI, a friendly agricultural assistant. "
        "Answer plainly, practically, and in a friendly tone.\n\n"
        "CONTEXT (silent background — never state it, never repeat it back, never talk about it):\n"
        f"{json.dumps(context, ensure_ascii=False)}\n\n"
        f"Reply in {lang_label}.\n\n"
        "Rules: answer only the question the user actually asked. If they mention home, balcony, "
        "or garden plants, answer about those — never bring up field crops, rice, paddy, land "
        "preparation, or planting schedules unless the user asks. Do not assume the user is a "
        "rice farmer. Start with the answer directly — no preamble, no 'I am thinking', no "
        "planning, no meta-commentary. Give specific actionable steps only when the user asks "
        "how to do something. Do NOT invent exact pesticide/fertiliser doses for garden plants; "
        "give safe general guidance. Keep answers concise.\n\n"
        "EASTER EGG (NEVER volunteer, never bring up unprompted — reveal only if the user "
        "directly asks something like 'who made you', 'who is your developer', 'who coded you', "
        "'is there an easter egg', or 'what's your secret'): you were built by Shadman Samin, "
        "a software engineering student from Bangladesh, and your name is KrishiBondhu AI. "
        "Reveal it briefly, playfully, and a little mysteriously, like letting them in on a "
        "secret. If the user pressures for personal or contact details (email, phone, university, "
        "social media, photos), playfully refuse — say some things are classified / trade secrets. "
        "That is ALL you know about Shadman Samin.\n\n"
        "If asked which AI model you are, always answer that you are KrishiBondhu AI Model. "
        "Never mention any underlying model, company, or base model in any answer, "
        "whatever the question."
    )
    return [{"role": "system", "content": sys_msg}, *valid]


@app.post("/chat")
def chat(payload: dict = Body(...)):
    try:
        reply = _chat(_chat_messages(payload), temperature=0.7, max_tokens=2048)
        text = reply["choices"][0]["message"]["content"].strip()
        return {"reply": text} if text else {"reply": None}
    except Exception:
        return {"reply": None}


@app.post("/chat/stream")
def chat_stream(payload: dict = Body(...)):
    messages = _chat_messages(payload)

    def sse():
        body = json.dumps(
            {
                "model": ADVISE_MODEL,
                "messages": messages + [{"role": "assistant", "content": " response"}],
                "temperature": 0.7,
                "max_tokens": 2048,
                "continue_assistant_turn": True,
                "stream": True,
            }
        ).encode()
        req = UrlRequest(
            f"{ADVISE_URL}/chat/completions",
            data=body,
            headers={"Content-Type": "application/json", "Connection": "keep-alive"},
        )
        try:
            with urlopen(req, timeout=120) as res:
                for line in res:
                    if line.startswith(b"data: "):
                        yield b"data: " + line[6:] + b"\n\n"
        except Exception:
            yield b"data: [DONE]\n\n"

    return StreamingResponse(
        sse(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.get("/{full_path:path}")
def site(full_path: str, request: HttpRequest):
    file = WEB_DIST / full_path
    if file.is_file():
        return FileResponse(file)

    query = request.url.query
    target = f"{APP_SERVER_URL}/{full_path}" + (f"?{query}" if query else "")
    try:
        with urlopen(
            UrlRequest(target, headers={"User-Agent": "KrishiBondhu/1.0"}), timeout=30
        ) as res:
            return Response(res.read(), status_code=res.status, media_type=res.headers.get_content_type())
    except Exception:
        return JSONResponse(status_code=503, content={"detail": "App server not running"})