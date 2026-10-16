"""KrishiBondhu AI demo Space — crop disease detection + bilingual chat + market.

Team PentaFarmers. YOLO model: hodoly163/krishibondhu-jktk (116 classes).
LLM: Groq (openai/gpt-oss-20b) via ADVISE_API_KEY secret. Market: live DAM scrape.
"""
import json
import os
import re
import urllib.parse
from urllib.request import Request as UrlRequest, urlopen

import spaces  # MUST come before torch / ultralytics (ZeroGPU hijack)
import gradio as gr
from huggingface_hub import hf_hub_download
from PIL import Image

MODEL_REPO = os.environ.get("HF_MODEL_REPO", "hodoly163/krishibondhu-jktk")
MODEL_FILE = os.environ.get("HF_MODEL_FILE", "jktk_x.pt")
ADVISE_URL = os.environ.get("ADVISE_URL", "https://api.groq.com/openai/v1")
ADVISE_MODEL = os.environ.get("ADVISE_MODEL", "openai/gpt-oss-20b")
ADVISE_API_KEY = os.environ.get("ADVISE_API_KEY", "")
OPENWEATHER_API_KEY = os.environ.get("OPENWEATHER_API_KEY", "")

print(f"Downloading {MODEL_REPO}/{MODEL_FILE} ...", flush=True)
_model_path = hf_hub_download(repo_id=MODEL_REPO, filename=MODEL_FILE)
from ultralytics import YOLO

model = YOLO(_model_path).to("cuda")
print(f"Model loaded: {len(model.names)} classes", flush=True)

KB = {
    "rice blast": ("Rice Blast (Magnaporthe oryzae). Organic: neem oil 5 ml/L every 5-7 days; "
                   "remove and burn infected plants. Chemical: Tricyclazole 75 WP 0.6 g/L within 3 days."),
    "late blight": ("Late Blight (Phytophthora infestans). Organic: Bordeaux mixture 1%, garlic extract; "
                    "destroy infected plants. Chemical: Mancozeb 75% WP 2.5g/L or Metalaxyl + Mancozeb 2g/L."),
}


def _llm(messages: list[dict], max_tokens: int = 512, temperature: float = 0.5) -> str:
    """Call the hosted LLM. Raises RuntimeError with a short message on failure."""
    body = json.dumps({"model": ADVISE_MODEL, "messages": messages,
                       "temperature": temperature, "max_tokens": max_tokens}).encode()
    headers = {"Content-Type": "application/json", "User-Agent": "KrishiBondhu/1.0"}
    if ADVISE_API_KEY:
        headers["Authorization"] = f"Bearer {ADVISE_API_KEY}"
    try:
        req = UrlRequest(f"{ADVISE_URL}/chat/completions", data=body, headers=headers)
        with urlopen(req, timeout=90) as res:
            data = json.loads(res.read())
        return (data["choices"][0]["message"]["content"] or "").strip()
    except Exception as e:
        raise RuntimeError(f"LLM unavailable ({str(e)[:120]}). Check ADVISE_API_KEY secret.")


@spaces.GPU(duration=60)
def predict(image: Image.Image, lang: str) -> tuple[str, str]:
    """Detect crop disease in a photo and give bilingual farmer advice.

    Args:
        image: Crop leaf/field photo.
        lang: Reply language ('en' or 'bn').
    Returns:
        (detection summary, advice text).
    """
    if image is None:
        return "No image.", "Please upload a crop photo."
    img = image.convert("RGB")
    res = model.predict(img, conf=0.25, imgsz=640, device="cuda", verbose=False)[0]
    dets = []
    for box, cls, conf in zip(res.boxes.xyxy.tolist(), res.boxes.cls.tolist(), res.boxes.conf.tolist()):
        dets.append({"class": model.names[int(cls)], "conf": round(float(conf), 4)})
    dets.sort(key=lambda d: d["conf"], reverse=True)
    if not dets:
        msg = {"en": "No disease detected. Keep monitoring.", "bn": "কোনো রোগ সনাক্ত হয়নি। পর্যবেক্ষণ চালিয়ে যান।"}
        return "No detections.", msg.get(lang, msg["en"])
    top = dets[0]
    summary = "\n".join(f"{d['class']}: {d['conf']:.2f}" for d in dets[:3])
    kb = KB.get(top["class"].lower(), "")
    sys = ("You are KrishiBondhu AI, an agricultural extension agent for Bangladesh. "
           "Write ONE status line + 2-3 action steps, plain farmer-friendly language. "
           f"Reply in {'Bengali' if lang == 'bn' else 'English'}.")
    user = (f"Detected: {top['class']} (confidence {top['conf']}). "
            f"Knowledge: {kb or 'Use clean seed, neem oil, good drainage.'} Give status + actions.")
    try:
        advice = _llm([{"role": "system", "content": sys}, {"role": "user", "content": user}])
    except RuntimeError as e:
        advice = f"{str(e)} Knowledge: {kb}"
    return summary, advice or "No advice generated."


def chat(message: str, history: list, lang: str) -> str:
    """Bilingual farming chat reply.

    Args:
        message: Farmer's question.
        history: Gradio chat history (unused beyond display).
        lang: Reply language ('en' or 'bn').
    Returns:
        Assistant reply text.
    """
    if not (message or "").strip():
        return "Please type a question."
    sys = ("You are KrishiBondhu AI, a friendly agricultural assistant for Bangladesh. "
           "Answer plainly and concisely. Never mention any underlying model. "
           f"Reply in {'Bengali' if lang == 'bn' else 'English'}.")
    try:
        return _llm([{"role": "system", "content": sys},
                     {"role": "user", "content": message.strip()}]) or "No reply generated."
    except RuntimeError as e:
        return str(e)


def market(top_n: int = 10) -> str:
    """Today's crop market prices from DAM.

    Args:
        top_n: Number of rows to show.
    Returns:
        Markdown table of prices.
    """
    rows = []
    try:
        for lang_q in ("?L=E", "?L=B"):
            req = UrlRequest("https://market.dam.gov.bd/" + lang_q,
                             headers={"User-Agent": "KrishiBondhu/1.0"})
            with urlopen(req, timeout=15) as res:
                html = res.read().decode("utf-8", "ignore")
            marq = re.search(r"<marquee[^>]*>(.*?)</marquee>", html, re.S | re.I)
            if marq:
                items = re.findall(r"([^<>|]+?)\s*:\s*([\d,.]+)", marq.group(1))
                rows = [(n.strip(), p.strip()) for n, p in items]
                if rows:
                    break
    except Exception:
        pass
    if not rows:
        return "Live market source unreachable right now — try again later."
    lines = ["| Crop | Price |", "|---|---|"]
    for name, price in rows[: max(1, min(int(top_n or 10), 30))]:
        lines.append(f"| {name} | {price} |")
    return "\n".join(lines)


with gr.Blocks(title="KrishiBondhu AI demo") as demo:
    gr.Markdown("# 🌾 KrishiBondhu AI — crop disease + farming advisor (PentaFarmers)")
    with gr.Tab("Disease detection"):
        img = gr.Image(type="pil", label="Crop photo")
        lang1 = gr.Radio(["en", "bn"], value="en", label="Language")
        btn = gr.Button("Detect")
        out_det = gr.Textbox(label="Detections")
        out_adv = gr.Textbox(label="Advice")
        btn.click(predict, [img, lang1], [out_det, out_adv])
        gr.Examples(["examples/rice_blast.jpg", "examples/tomato_late_blight.jpg"],
                    [img], fn=predict, outputs=[out_det, out_adv],
                    cache_examples=True, cache_mode="lazy")
    with gr.Tab("Chat advisor"):
        gr.ChatInterface(chat, additional_inputs=[gr.Radio(["en", "bn"], value="en", label="Language")])
    with gr.Tab("Market prices"):
        n = gr.Slider(5, 30, value=10, step=1, label="Rows")
        mbtn = gr.Button("Fetch prices")
        mout = gr.Markdown()
        mbtn.click(market, [n], [mout])

demo.launch(mcp_server=True)
