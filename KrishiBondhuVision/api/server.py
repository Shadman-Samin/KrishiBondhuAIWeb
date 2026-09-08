import io
import json
import os
import re as _re
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
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY") or os.environ.get("VITE_OPENWEATHER_API_KEY") or ""
OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"

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


def _run_yolo(image_bytes: bytes):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
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
    return detections, top


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    data = await file.read()
    detections, top = _run_yolo(data)
    return {"detections": detections, "top": top}


# ---------------------------------------------------------------------------
# Compat shim for Flutter app: POST /disease/detect
# App sends multipart field `image` (or `file`) + optional `locale`.
# Returns BOTH the native {detections,top} AND a DiseaseResult-shaped
# object so either decoder works. Also aliased as /api/disease/detect.
# ---------------------------------------------------------------------------
_DISEASE_KB = {
    "rice blast": {
        "disease": "Rice Blast",
        "diseaseBn": "ধানের ব্লাস্ট রোগ",
        "scientificName": "Magnaporthe oryzae",
        "severity": "Moderate",
        "severityBn": "মাঝারি",
        "organicTreatment": "Spray neem oil solution (5 ml/L) on affected leaves every 5-7 days. Remove and burn heavily infected plants.",
        "organicTreatmentBn": "আক্রান্ত পাতায় প্রতি ৫–৭ দিন পরপর নিম তেলের দ্রবণ (৫ মিলি/লিটার) স্প্রে করুন। মারাত্মক আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন।",
        "chemicalTreatment": "Apply Tricyclazole 75 WP (0.6 g/L) within 3 days. Repeat after 10-12 days if lesions persist.",
        "chemicalTreatmentBn": "৩ দিনের মধ্যে ট্রাইসাইক্লাজল ৭৫ ডব্লিউপি (০.৬ গ্রাম/লিটার) প্রয়োগ করুন। দাগ থেকে গেলে ১০–১২ দিন পর আবার দিন।",
        "prevention": "Use resistant varieties, avoid excess nitrogen, and keep the field free of standing water at night.",
        "preventionBn": "প্রতিরোধী জাত ব্যবহার করুন, অতিরিক্ত নাইট্রোজেন এড়িয়ে চলুন এবং রাতে জমিতে দাঁড়ানো পানি রাখবেন না।",
    },
    "tomato late blight": {
        "disease": "Late Blight",
        "diseaseBn": "লেট ব্লাইট",
        "scientificName": "Phytophthora infestans",
        "severity": "High",
        "severityBn": "উচ্চ",
        "organicTreatment": "Bordeaux mixture (1%). Garlic extract spray. Remove and destroy infected plants immediately.",
        "organicTreatmentBn": "বর্দো মিশ্রণ (১%)। রসুনের নির্যাস স্প্রে। আক্রান্ত গাছ তৎক্ষণাৎ সরিয়ে ধ্বংস করুন।",
        "chemicalTreatment": "Mancozeb 75% WP (2.5g/L) or Metalaxyl + Mancozeb (2g/L). Spray every 7-10 days.",
        "chemicalTreatmentBn": "ম্যানকোজেব ৭৫% ডব্লিউপি (২.৫গ্রাম/লিটার) বা মেটালাক্সিল + ম্যানকোজেব (২গ্রাম/লিটার)। ৭–১০ দিন পরপর স্প্রে করুন।",
        "prevention": "Use certified seed. Ensure good air circulation. Avoid overhead irrigation.",
        "preventionBn": "সার্টিফাইড বীজ ব্যবহার করুন। ভালো বাতাস চলাচল নিশ্চিত করুন। উপরে সেচ এড়িয়ে চলুন।",
    },
    "potato late blight": {
        "disease": "Late Blight",
        "diseaseBn": "লেট ব্লাইট",
        "scientificName": "Phytophthora infestans",
        "severity": "High",
        "severityBn": "উচ্চ",
        "organicTreatment": "Bordeaux mixture (1%). Garlic extract spray. Remove and destroy infected plants immediately.",
        "organicTreatmentBn": "বর্দো মিশ্রণ (১%)। রসুনের নির্যাস স্প্রে। আক্রান্ত গাছ তৎক্ষণাৎ সরিয়ে ধ্বংস করুন।",
        "chemicalTreatment": "Mancozeb 75% WP (2.5g/L) or Metalaxyl + Mancozeb (2g/L). Spray every 7-10 days.",
        "chemicalTreatmentBn": "ম্যানকোজেব ৭৫% ডব্লিউপি (২.৫গ্রাম/লিটার) বা মেটালাক্সিল + ম্যানকোজেব (২গ্রাম/লিটার)। ৭–১০ দিন পরপর স্প্রে করুন।",
        "prevention": "Use certified seed. Ensure good air circulation. Avoid overhead irrigation.",
        "preventionBn": "সার্টিফাইড বীজ ব্যবহার করুন। ভালো বাতাস চলাচল নিশ্চিত করুন। উপরে সেচ এড়িয়ে চলুন।",
    },
}


def _disease_result_for_top(top, locale: str = "en"):
    if not top:
        return None
    cls = str(top.get("class", "")).lower().strip()
    kb = _DISEASE_KB.get(cls)
    bn = locale == "bn"
    if kb:
        return {
            "disease": kb["diseaseBn"] if bn else kb["disease"],
            "scientificName": kb["scientificName"],
            "confidence": top.get("conf", 0),
            "severity": kb["severityBn"] if bn else kb["severity"],
            "organicTreatment": kb["organicTreatmentBn"] if bn else kb["organicTreatment"],
            "chemicalTreatment": kb["chemicalTreatmentBn"] if bn else kb["chemicalTreatment"],
            "prevention": kb["preventionBn"] if bn else kb["prevention"],
        }
    # fallback: generic mapping from raw class label
    conf = float(top.get("conf", 0))
    sev = "High" if conf > 0.85 else "Moderate" if conf > 0.6 else "Low"
    if bn and sev == "High":
        sev = "উচ্চ"
    elif bn and sev == "Moderate":
        sev = "মাঝারি"
    elif bn:
        sev = "কম"
    title = top.get("class", "Unknown")
    return {
        "disease": title,
        "scientificName": "",
        "confidence": round(conf, 4),
        "severity": sev,
        "organicTreatment": "Remove affected leaves and spray neem oil (5 ml/L) every 5-7 days." if not bn else "আক্রান্ত পাতা সরিয়ে প্রতি ৫–৭ দিন পরপর নিম তেল (৫ মিলি/লিটার) স্প্রে করুন।",
        "chemicalTreatment": "Consult local extension for targeted fungicide for this crop." if not bn else "এই ফসলের জন্য স্থানীয় কৃষি কর্মকর্তার পরামর্শে ছত্রাকনাশক ব্যবহার করুন।",
        "prevention": "Use clean seed, balanced fertilizer, and good field hygiene." if not bn else "পরিষ্কার বীজ, সুষম সার এবং পরিষ্কার ক্ষেত ব্যবস্থাপনা অনুসরণ করুন।",
    }


@app.post("/disease/detect")
@app.post("/api/disease/detect")
async def disease_detect(
    request: HttpRequest,
    file: UploadFile | None = File(default=None),
    image: UploadFile | None = File(default=None),
):
    upload = file or image
    form_data = None
    # If no direct file param, try to extract from multipart form (handles any field name)
    if upload is None:
        try:
            form_data = await request.form()
            for key in ("image", "file", "photo", "picture"):
                if key in form_data and hasattr(form_data[key], "read"):
                    upload = form_data[key]  # type: ignore
                    break
        except Exception:
            pass
    if upload is None:
        return JSONResponse(status_code=400, content={"detail": "Missing image/file field. Send multipart with `image` or `file`."})
    # locale from form field or query param (reuse already-read form_data if available)
    locale = "en"
    try:
        if form_data is None and request.headers.get("content-type", "").startswith("multipart"):
            form_data = await request.form()
        found = None
        if form_data is not None:
            try:
                v = form_data.get("locale")  # type: ignore
                if v is not None and str(v).strip():
                    found = str(v).lower().strip()
            except Exception:
                pass
        if found in ("en", "bn"):
            locale = found
        else:
            q = request.query_params.get("locale")
            if q and q.lower().strip() in ("en", "bn"):
                locale = q.lower().strip()
            elif found is not None:
                locale = "en"  # invalid value
    except Exception:
        locale = str(request.query_params.get("locale", "en")).lower()
        if locale not in ("en", "bn"):
            locale = "en"
    data = await upload.read()
    detections, top = _run_yolo(data)
    disease_result = _disease_result_for_top(top, locale)
    if disease_result:
        return {**disease_result, "detections": detections, "top": top}
    # No detection — keep DiseaseResult.fromJson happy (disease: String non-null)
    # Flutter's lib/features/disease/data/disease_result.dart:26 requires non-null disease/confidence/severity
    if locale == "bn":
        return {
            "detections": detections,
            "top": top,
            "disease": "কোনো রোগ সনাক্ত হয়নি",
            "scientificName": "",
            "confidence": 0.0,
            "severity": "None",
            "organicTreatment": "কোনো চিকিৎসা প্রয়োজন নেই। পর্যবেক্ষণ চালিয়ে যান।",
            "chemicalTreatment": "কোনো রাসায়নিক প্রয়োগ প্রয়োজন নেই।",
            "prevention": "নিয়মিত পর্যবেক্ষণ ও ভালো পরিচর্যা বজায় রাখুন।",
        }
    return {
        "detections": detections,
        "top": top,
        "disease": "No disease detected",
        "scientificName": "",
        "confidence": 0.0,
        "severity": "None",
        "organicTreatment": "No treatment needed. Continue monitoring.",
        "chemicalTreatment": "No chemical application needed.",
        "prevention": "Maintain regular monitoring and good field hygiene.",
    }


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
        "Greeting rule: Mirror the user's greeting. "
        "If user says hi/hello/hey → reply with Hi/Hello. "
        "If user says salam/assalamu alaikum/walaikum salam → reply with Salam/Assalamu Alaikum. "
        "If user says namaste/namaskar/nomoshkar → reply with Namaste. "
        "If user uses multiple, mirror the first one they used. "
        "If no greeting, use neutral Hello (en) or Assalamu Alaikum/Hello (bn). "
        "Keep it one line, friendly, then answer the question.\n\n"
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


# ---------------------------------------------------------------------------
# Compat shims for Flutter app — keep native routes live, add aliases
# so GUIDE.md `one-line swap` works without app-side URL rewrites.
# ---------------------------------------------------------------------------

# Market: Flutter expects GET /market/prices -> List<MarketPrice>
# Native is GET /market-prices -> {updated_at,sources,rows}
_CATEGORY_MAP = {
    "Rice": "Grains", "Wheat": "Grains", "Maize": "Grains", "Potato": "Vegetables",
    "Tomato": "Vegetables", "Onion": "Vegetables", "Chili": "Vegetables",
    "Eggplant": "Vegetables", "Jute": "Cash crops", "Mustard": "Cash crops",
    "Lentil": "Pulses", "Lentils": "Pulses", "Garlic": "Vegetables", "Sugar": "Grains",
}
_EMOJI_MAP = {
    "Rice": "🌾", "Wheat": "🌾", "Maize": "🌽", "Potato": "🥔", "Tomato": "🍅",
    "Onion": "🧅", "Chili": "🌶️", "Eggplant": "🍆", "Jute": "🌱", "Mustard": "🫘",
    "Lentil": "🫛", "Lentils": "🫛", "Garlic": "🧄", "Sugar": "🍬", "Banana": "🍌",
}


def _to_market_price_list(rows):
    out = []
    for r in rows:
        crop = str(r.get("crop", "")).split(" (")[0].split(" -")[0].strip()
        # use DAM crop name as-is for display; map category/emoji by keyword
        cat = "Grains"
        emoji = "🌾"
        for k, v in _CATEGORY_MAP.items():
            if k.lower() in str(r.get("crop", "")).lower():
                cat = v
                break
        for k, v in _EMOJI_MAP.items():
            if k.lower() in str(r.get("crop", "")).lower():
                emoji = v
                break
        out.append({
            "name": r.get("crop", crop),
            "nameBn": r.get("cropBn", r.get("crop", crop)),
            "emoji": emoji,
            "category": cat,
            "pricePerKg": r.get("price", 0),
            "changePercent": r.get("change_pct", 0),
            # extra fields kept for debugging / future use
            "min": r.get("min"),
            "max": r.get("max"),
            "date": r.get("date"),
            "unit": r.get("unit", "kg"),
        })
    return out


@app.get("/market/prices")
@app.get("/api/market/prices")
def market_prices_compat():
    rows, _ = market.get_prices()
    return _to_market_price_list(rows)


@app.get("/market-prices-compat")
def _deprecated_market_prices_compat():
    # internal: not advertised
    rows, _ = market.get_prices()
    return _to_market_price_list(rows)


# Assistant: Flutter POST /assistant/chat {message, history:[{id,role,text}], locale}
# Native POST /chat {messages:[{role,content}], lang, context}
import uuid as _uuid


@app.post("/assistant/chat")
@app.post("/api/assistant/chat")
def assistant_chat_compat(payload: dict = Body(...)):
    try:
        message = str(payload.get("message") or payload.get("text") or "").strip()
        locale = str(payload.get("locale") or payload.get("lang") or "en").lower()
        if locale not in ("en", "bn"):
            locale = "en"
        history = payload.get("history") or []
        # history items are {id, role, text} -> map to {role, content}
        messages = []
        for h in history[-CHAT_MAX_MESSAGES:]:
            role = h.get("role")
            text = h.get("text") or h.get("content") or ""
            if role in ("user", "assistant") and text:
                messages.append({"role": role, "content": str(text)})
        if message:
            messages.append({"role": "user", "content": message})
        # Reuse native chat logic
        adapted = {"messages": messages, "lang": locale, "context": payload.get("context") or {}}
        reply = _chat(_chat_messages(adapted), temperature=0.7, max_tokens=2048)
        text = (reply.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
        if not text:
            return JSONResponse(status_code=502, content={"detail": "LLM empty reply"})
        # Flutter expects ChatMessage {id, role, text}
        return {"id": f"msg-{_uuid.uuid4().hex[:8]}", "role": "assistant", "text": text}
    except Exception as e:
        return JSONResponse(status_code=502, content={"detail": f"assistant error: {e}"})


# Weather — live OpenWeather via your PC. App just calls GET /weather/forecast?district=&locale= and gets real data.
# Falls back to stub only if OPENWEATHER_API_KEY missing or fetch fails (so app never breaks offline).
_WEATHER_CACHE: dict = {}
_WEATHER_TTL = 600  # 10 min
_WEATHER_COORDS = {
    "Dhaka": (23.8103, 90.4125), "Chattogram": (22.3569, 91.7832), "Chittagong": (22.3569, 91.7832),
    "Rajshahi": (24.3745, 88.6042), "Khulna": (22.8456, 89.5403), "Bogura": (24.8465, 89.3772),
    "Sylhet": (24.8949, 91.8687), "Mymensingh": (24.7539, 90.4073), "Barishal": (22.701, 90.3535),
    "Rangpur": (25.7439, 89.2752), "Comilla": (23.4607, 91.1809), "Dinajpur": (25.6279, 88.6333),
    "Jessore": (23.1665, 89.2081), "Cox's Bazar": (21.4272, 92.0058),
}
_WEATHER_CONDITION_BN = {
    "Partly cloudy": "আংশিক মেঘলা", "Cloudy": "মেঘলা", "Sunny": "রৌদ্রোজ্জ্বল", "Clear": "পরিষ্কার",
    "Rainy": "বৃষ্টিপাত", "Stormy": "ঝড়ো", "Foggy": "কুয়াশাচ্ছন্ন", "Hazy": "কুয়াশা",
}

def _weather_icon(main: str) -> str:
    m = (main or "").lower()
    if m in ("thunderstorm", "tornado", "squall", "ash"): return "storm"
    if m in ("drizzle", "rain"): return "rain"
    if m in ("snow",): return "cloud"
    if m in ("clear",): return "sun"
    if m in ("clouds",): return "cloud"
    return "cloud"

def _weather_condition_text(main: str, desc: str, bn: bool) -> str:
    m = (main or "").lower()
    if m == "clear": en = "Clear"
    elif m == "clouds": en = "Partly cloudy" if "few" in (desc or "").lower() or "scattered" in (desc or "").lower() else "Cloudy"
    elif m in ("rain", "drizzle"): en = "Rainy"
    elif m == "thunderstorm": en = "Stormy"
    elif m in ("mist", "fog"): en = "Foggy"
    elif m in ("haze", "smoke", "dust", "sand"): en = "Hazy"
    else: en = (main or "Cloudy").title()
    if bn:
        return _WEATHER_CONDITION_BN.get(en, en)
    return en

def _weather_advisory(temp: float, humidity: int, pop: float, condition: str):
    cond_low = (condition or "").lower()
    is_stormy = "storm" in cond_low
    is_rainy = "rain" in cond_low
    if is_stormy:
        return ("বজ্রঝড় সতর্কতা। চারা রক্ষা করুন এবং নিষ্কাশন নিশ্চিত করুন।", "Thunderstorm warning. Protect seedlings and ensure drainage.")
    if is_rainy and pop > 60:
        return ("প্রচুর বৃষ্টি প্রত্যাশিত। নিষ্কাশন খাল পরিষ্কার করুন এবং কীটনাশক প্রয়োগ বিলম্ব করুন।", "Heavy rain expected. Clear drainage channels and delay pesticide application.")
    if temp > 35:
        return ("প্রচণ্ড গরম। ভোরবেলা বা সন্ধ্যায় সেচ দিন।", "Extreme heat. Irrigate in early morning or evening.")
    if temp > 30 and humidity > 80:
        return ("গরম ও আর্দ্র। ছত্রাক রোগ পর্যবেক্ষণ করুন।", "Hot and humid. Monitor for fungal diseases.")
    if pop > 40:
        return ("মাঝারি বৃষ্টির সম্ভাবনা। মাটির আর্দ্রতা দেখে রোপণের প্রস্তুতি নিন।", "Moderate rain chance. Prepare for planting if soil moisture is adequate.")
    return ("মাঝারি আবহাওয়া। সাধারণ রক্ষণাবেক্ষণের জন্য ভালো।", "Moderate weather. Good for general farm maintenance.")

def _weather_stub(district: str, locale: str, note: str):
    bn = locale == "bn"
    return {
        "district": district,
        "todayHigh": 31,
        "todayLow": 24,
        "condition": "আংশিক মেঘলা" if bn else "Partly cloudy",
        "humidity": 78,
        "rainChance": 65,
        "advisoryBn": "আগামীকাল ভারী বৃষ্টির সম্ভাবনা রয়েছে। আজকে সেচ না দিলেও চলবে।",
        "advisoryEn": "Heavy rain is likely tomorrow — you can skip irrigation today.",
        "alerts": [],
        "daily": [
            {"day": "Mon" if not bn else "সোম", "high": 31, "low": 24, "icon": "rain"},
            {"day": "Tue" if not bn else "মঙ্গল", "high": 29, "low": 23, "icon": "storm"},
            {"day": "Wed" if not bn else "বুধ", "high": 30, "low": 24, "icon": "cloud"},
            {"day": "Thu" if not bn else "বৃহঃ", "high": 32, "low": 25, "icon": "sun"},
        ],
        "_note": note,
    }

def _fetch_openweather(lat: float, lon: float):
    import time as _time
    import urllib.parse as _parse
    base = OPENWEATHER_BASE
    key = OPENWEATHER_API_KEY
    # Use 5-day forecast (3-hour steps) — enough for today + next 3 days, single call
    url = f"{base}/forecast?lat={lat}&lon={lon}&appid={_parse.quote(key)}&units=metric"
    req = UrlRequest(url, headers={"User-Agent": "KrishiBondhu/1.0"})
    with urlopen(req, timeout=10) as res:
        return json.loads(res.read())

@app.get("/weather/forecast")
@app.get("/api/weather/forecast")
def weather_forecast_compat(district: str = "Dhaka", locale: str = "en"):
    import time as _time
    import calendar as _cal
    bn = locale == "bn"
    cache_key = f"{district.strip().lower()}|{locale}"
    now = _time.time()
    cached = _WEATHER_CACHE.get(cache_key)
    if cached and now - cached[0] < _WEATHER_TTL:
        return cached[1]

    if not OPENWEATHER_API_KEY:
        return _weather_stub(district, locale, "stub — OPENWEATHER_API_KEY not set in KrishiBondhuVision/.env")

    # normalize district (case-insensitive, aliases)
    dkey = district.strip()
    coords = None
    for k, v in _WEATHER_COORDS.items():
        if k.lower() == dkey.lower():
            coords = v
            district = k  # canonical
            break
    if coords is None:
        # try fallback: Dhaka
        coords = _WEATHER_COORDS["Dhaka"]

    try:
        data = _fetch_openweather(coords[0], coords[1])
        lst = data.get("list") or []
        if not lst:
            raise ValueError("empty forecast list")

        first = lst[0]
        today_temp = float(first["main"]["temp"])
        today_high = int(round(max(float(x["main"]["temp_max"]) for x in lst[:4])))
        today_low = int(round(min(float(x["main"]["temp_min"]) for x in lst[:4])))
        humidity = int(first["main"]["humidity"])
        pop = float(first.get("pop", 0)) * 100
        # also consider max pop among next 8 entries for rainChance
        max_pop = max(float(x.get("pop", 0)) for x in lst[:8]) * 100
        main = (first.get("weather") or [{}])[0].get("main", "Clouds")
        desc = (first.get("weather") or [{}])[0].get("description", "")
        condition = _weather_condition_text(main, desc, bn)
        bn_adv, en_adv = _weather_advisory(today_temp, humidity, max_pop, condition)
        advisoryBn, advisoryEn = bn_adv, en_adv

        # build daily: group by date, take next 4 days
        from collections import defaultdict as _dd
        by_date: dict = _dd(list)
        for it in lst:
            dstr = it.get("dt_txt", "")[:10]
            if dstr: by_date[dstr].append(it)
        sorted_dates = sorted(by_date.keys())
        # skip today if we have >4 days and today is incomplete? Keep first 4
        daily = []
        bn_days = {"Mon": "সোম", "Tue": "মঙ্গল", "Wed": "বুধ", "Thu": "বৃহঃ", "Fri": "শুক্র", "Sat": "শনি", "Sun": "রবি"}
        for dstr in sorted_dates[:4]:
            items = by_date[dstr]
            highs = [float(x["main"]["temp_max"]) for x in items]
            lows = [float(x["main"]["temp_min"]) for x in items]
            # dominant weather
            counts: dict = {}
            for x in items:
                mm = (x.get("weather") or [{}])[0].get("main", "Clouds")
                counts[mm] = counts.get(mm, 0) + 1
            dom = max(counts, key=counts.get) if counts else "Clouds"
            icon = _weather_icon(dom)
            # weekday
            try:
                y, m, d = map(int, dstr.split("-"))
                wday = _cal.day_name[_cal.weekday(y, m, d)][:3]
            except Exception:
                wday = dstr
            if bn: wday = bn_days.get(wday, wday)
            daily.append({"day": wday, "high": int(round(max(highs))), "low": int(round(min(lows))), "icon": icon})

        out = {
            "district": district,
            "todayHigh": today_high,
            "todayLow": today_low,
            "condition": condition,
            "humidity": humidity,
            "rainChance": int(round(max_pop)),
            "advisoryBn": advisoryBn,
            "advisoryEn": advisoryEn,
            "alerts": [],
            "daily": daily,
        }
        _WEATHER_CACHE[cache_key] = (now, out)
        return out
    except Exception as e:
        # fallback to stub so app never crashes
        return _weather_stub(district, locale, f"live fetch failed ({e}) — fallback")


@app.get("/satellite/analysis")
@app.get("/api/satellite/analysis")
def satellite_compat(district: str = "Dhaka", locale: str = "en"):
    bn = locale == "bn"
    return {
        "district": district,
        "ndvi": 0.74,
        "cropHealth": "সুস্থ" if bn else "Healthy",
        "waterStress": "কম — সাম্প্রতিক বৃষ্টিপাত পর্যাপ্ত" if bn else "Low — recent rainfall adequate",
        "floodRisk": "আগামী ৭ দিনে ঝুঁকি সামান্য" if bn else "Minimal for the next 7 days",
        "yieldEstimate": "প্রক্ষেপিত ৬.১ টন/হেক্টর (ধান)" if bn else "6.1 t/ha projected (rice)",
        "_note": "stub — wire to Earth Engine / NASA in api/server.py when ready",
    }


@app.post("/soil/analyze")
@app.post("/api/soil/analyze")
def soil_compat(payload: dict = Body(...)):
    location = str(payload.get("location") or payload.get("district") or "Dhaka")
    locale = str(payload.get("locale") or "en").lower()
    bn = locale == "bn"
    return {
        "location": location,
        "ph": 6.4,
        "nitrogen": "মাঝারি" if bn else "Medium",
        "phosphorus": "বেশি" if bn else "High",
        "potassium": "কম" if bn else "Low",
        "recommendedCrop": "ধান (ব্রি ধান২৯)" if bn else "Rice (BRRI dhan29)",
        "fertilizerAdvice": "পটাশিয়ামের ঘাটতি পূরণে হেক্টরপ্রতি ৭০ কেজি এমওপি প্রয়োগ করুন।" if bn else "Apply MoP 70 kg/ha to correct low potassium.",
        "expectedYield": "৬.২ টন/হেক্টর" if bn else "6.2 t/ha",
        "_note": "stub — wire to soil API when ready",
    }


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