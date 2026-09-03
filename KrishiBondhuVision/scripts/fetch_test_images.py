import json
import ssl
import sys
import urllib.parse
import urllib.request
from pathlib import Path

_ctx = ssl._create_unverified_context()
OUT = Path(__file__).resolve().parent.parent / "test_images" / "mine"

QUERIES = {
    "rice_blast": "rice blast disease leaf",
    "rice_leaf_blight": "rice bacterial leaf blight",
    "rice_brown_spot": "rice brown spot",
    "tomato_early_blight": "tomato early blight disease",
    "tomato_late_blight": "tomato late blight",
    "mango_anthracnose": "mango anthracnose",
    "banana_sigatoka": "banana black sigatoka",
}


def commons_hits(query, limit=3):
    params = {
        "action": "query", "format": "json",
        "generator": "search", "gsrnamespace": "6",
        "gsrlimit": str(limit), "gsrsearch": query,
        "prop": "imageinfo", "iiprop": "url|mime|size",
        "iiurlwidth": "800",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "KrishiBondhuVision/0.2 (test image fetch)"})
    with urllib.request.urlopen(req, timeout=30, context=_ctx) as r:
        data = json.load(r)
    pages = (data.get("query") or {}).get("pages") or {}
    out = []
    for pg in sorted(pages.values(), key=lambda x: x.get("index", 0)):
        ii = (pg.get("imageinfo") or [{}])[0]
        if ii.get("mime") == "image/jpeg" and ii.get("size", 0) < 5_000_000:
            out.append(ii.get("thumburl") or ii.get("url"))
    return out


def main():
    only = sys.argv[1:] or list(QUERIES)
    OUT.mkdir(parents=True, exist_ok=True)
    ok = fail = 0
    for name, query in QUERIES.items():
        if name not in only:
            continue
        try:
            hits = commons_hits(query)
        except Exception as e:
            print(f"[x] {name}: {e}")
            fail += 1
            continue
        if not hits:
            print(f"[ ] {name}: no jpeg hits")
            continue
        url = hits[0]
        try:
            dest = OUT / f"{name}.jpg"
            req = urllib.request.Request(url, headers={"User-Agent": "KrishiBondhuVision/0.1 (test image fetch)"})
            with urllib.request.urlopen(req, timeout=30, context=_ctx) as r, open(dest, "wb") as f:
                f.write(r.read())
            print(f"[+] {name}  {dest.stat().st_size//1024} KB  {url[:80]}")
            ok += 1
        except Exception as e:
            print(f"[x] {name}: {e}")
            fail += 1
    print(f"\ndownloaded={ok} failed={fail}")


if __name__ == "__main__":
    main()