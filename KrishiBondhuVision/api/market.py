"""Daily official market prices from the Department of Agricultural Marketing (DAM).

Fetches the national daily price board from market.dam.gov.bd (authoritative,
government source), keeps a rolling history file so /market-prices/history has
real trend data, and seeds the first history from the existing official DAM
dataset already shipped in the web app (KrishiBondhuWeb/src/data/market-prices.json).

ponytail: second live feed (a community tracker / TCB) died and the gov open-data
portal is flaky — this is DAM-only for now. Add a second fetcher here when a
reachable independent live source resurfaces.
"""
import json
import os
import re
from datetime import date
from pathlib import Path
from urllib.request import Request, build_opener, urlopen

DAM_BASE = "https://market.dam.gov.bd"
ROOT = Path(__file__).resolve().parent.parent
HISTORY_FILE = ROOT / "market_history.json"
STATIC_CANDIDATES = [
    Path(os.environ["MARKET_STATIC_FILE"]) if os.environ.get("MARKET_STATIC_FILE") else None,
    ROOT / "data" / "market-prices.json",
    ROOT.parent / "KrishiBondhuWeb" / "src" / "data" / "market-prices.json",
]
STATIC_FILE = next((p for p in STATIC_CANDIDATES if p and p.is_file()), STATIC_CANDIDATES[1])

_UA = "KrishiBondhu/1.0 (+competition demo)"
_opener = build_opener()

# DAM marquee commodity -> static dataset crop (for seeding real history)
_CROP_MAP = [
    (r"^(Aman|Boro|Aus)-", "Rice"),
    (r"^Onion", "Onion"),
    (r"^Garlic", "Garlic"),
    (r"^Green Chili", "Chili"),
    (r"^Potato", "Potato"),
    (r"^Sugar( \(|$)", "Sugar"),
    (r"^Masur", "Lentils"),
    (r"^Wheat", "Wheat"),
    (r"^(Gram|Mung|Soybean|Beef|Mutton|Egg|Ata)", "$0"),
]

_cache = {"day": None, "data": None, "ok": False}
_last_good = {"data": None}


def _get(url, timeout=20):
    return _opener.open(Request(url, headers={"User-Agent": _UA}), timeout=timeout).read()


def _fetch_page(lang):
    return _get(f"{DAM_BASE}/?L={lang}").decode("utf-8", "ignore")


def _parse_sticker(html):
    """Parse the homepage price marquee: commodity, min-max, change%.

    Generated server-side — no session/CSRF needed.
    """
    rows = []
    pat = re.compile(
        r'<span class="stockbox"><a href="#[^"]*">([^<]+)</a>:&nbsp;\s*'
        r'([\d.]+)\s*-\s*([\d.]+)\s*<span[^>]*>\s*([^<]*)</span>'
    )
    for m in pat.finditer(html):
        name = m.group(1).strip()
        lo, hi = float(m.group(2)), float(m.group(3))
        change = m.group(4)
        sign = -1 if "\u25bc" in change else 1  # ▼ down, ▲ up
        pct = re.search(r"([\d.]+)%", change)
        rows.append(
            {
                "crop": name,
                "price": round((lo + hi) / 2, 2),
                "min": lo,
                "max": hi,
                "change_pct": round(sign * float(pct.group(1)), 2) if pct else 0.0,
            }
        )
    return rows


def _pair_bn(rows, bn_html):
    """Attach Bangla commodity names from the Bengali page (same order on both)."""
    bn = [m.group(1).strip() for m in re.finditer(
        r'<span class="stockbox"><a href="#[^"]*">([^<]+)</a>:&nbsp;\s*[\d.]+', bn_html
    )]
    if len(bn) != len(rows):
        return
    for row, name in zip(rows, bn):
        row["cropBn"] = name


def fetch_dam():
    en, bn = _fetch_page("E"), _fetch_page("B")
    rows = _parse_sticker(en)
    _pair_bn(rows, bn)
    today = date.today().isoformat()
    for r in rows:
        r.update(cropBn=r.get("cropBn", r["crop"]), date=today, unit="kg", source="dam")
    return rows


def _cell_name(name):
    for pat, mapped in _CROP_MAP:
        if re.match(pat, name):
            return None if mapped == "$0" else mapped
    return None


def _seed_history():
    """Seed per-crop national-proxy history from the shipped official dataset."""
    if not STATIC_FILE.is_file():
        return {}
    try:
        data = json.loads(STATIC_FILE.read_text("utf-8-sig"))
    except Exception:
        return {}
    by_crop: dict[str, dict[str, float]] = {}
    for rec in data:
        crop = rec.get("crop")
        if not crop or "price" not in rec:
            continue
        bucket = by_crop.setdefault(crop, {})
        bucket[rec["date"]] = max(bucket.get(rec["date"], 0.0), float(rec["price"]))
    return by_crop


def get_history(crop, days=30):
    history = {}
    if HISTORY_FILE.is_file():
        try:
            history = json.loads(HISTORY_FILE.read_text("utf-8"))
        except Exception:
            history = {}
    by_date = dict(history.get(crop, {}))

    if (name := _cell_name(crop)) and (seed := _seed_history()).get(name):
        by_date = {**{d: p for d, p in seed[name].items()}, **by_date}  # live wins

    return [{"date": d, "price": p} for d, p in sorted(by_date.items())][-days:]


def _save_history(history):
    HISTORY_FILE.write_text(
        json.dumps(history, ensure_ascii=False, indent=1), encoding="utf-8"
    )

def _static_rows():
    """Per-crop rows from the shipped official DAM dataset (offline fallback).

    The dataset holds per-market records; aggregate to one row per crop so the
    shape matches the live marquee rows (crop/cropBn/price/min/max/change_pct).
    """
    if not STATIC_FILE.is_file():
        return []
    try:
        data = json.loads(STATIC_FILE.read_text("utf-8-sig"))
    except Exception:
        return []
    by_crop: dict[str, dict] = {}
    for rec in data:
        crop = str(rec.get("crop") or "").strip()
        if not crop or "price" not in rec:
            continue
        try:
            price = float(rec["price"])
        except (TypeError, ValueError):
            continue
        row = by_crop.setdefault(
            crop,
            {
                "crop": crop,
                "cropBn": rec.get("cropBn") or crop,
                "prices": [],
                "date": str(rec.get("date") or ""),
                "unit": str(rec.get("unit") or "kg").lower(),
                "source": "dataset",
            },
        )
        row["prices"].append(price)
        row["date"] = max(row["date"], str(rec.get("date") or ""))
    rows = []
    for row in by_crop.values():
        prices = row.pop("prices")
        row["price"] = round(sum(prices) / len(prices), 2)
        row["min"] = round(min(prices), 2)
        row["max"] = round(max(prices), 2)
        row["change_pct"] = 0.0
        rows.append(row)
    rows.sort(key=lambda r: r["crop"])
    return rows


def get_prices():
    """Today's national prices, cached for the day. Returns (rows, fresh).

    Never raises: if the DAM site is unreachable (it often is), fall back to the
    last successful fetch, then to the shipped dataset, then to an empty list.
    """
    day = date.today().isoformat()
    if _cache["day"] == day and _cache["ok"]:
        return _cache["data"], False

    rows = []
    try:
        rows = fetch_dam()
    except Exception:
        rows = []

    if not rows:
        rows = _last_good["data"] or _static_rows()

    if rows and rows[0].get("source") == "dam":
        history = {}
        if HISTORY_FILE.is_file():
            try:
                history = json.loads(HISTORY_FILE.read_text("utf-8"))
            except Exception:
                history = {}
        for r in rows:
            history.setdefault(r["crop"], {})[day] = r["price"]
        _save_history(history)
        _last_good["data"] = rows

    _cache["day"], _cache["data"], _cache["ok"] = day, rows, bool(rows)
    return rows, True