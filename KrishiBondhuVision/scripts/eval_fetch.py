import hashlib
import ssl
import time
import urllib.request
from pathlib import Path

from fetch_test_images import commons_hits

_ctx = ssl._create_unverified_context()
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "test_images" / "eval"
MINE = ROOT / "test_images" / "mine"

QUERIES = {
    "corn_rust": "corn rust on leaf",
    "corn_leaf_blight": "maize leaf blight",
    "tomato_early_blight": "tomato early blight",
    "tomato_late_blight": "potato late blight on leaf",
    "tomato_mosaic": "tomato mosaic virus leaf",
    "tomato_septoria": "tomato septoria leaf spot",
    "potato_early_blight": "potato early blight",
    "potato_late_blight": "potato blight leaf",
    "rice_blast": "rice blast disease field",
    "rice_sheath_blight": "rice sheath blight",
    "rice_brown_spot": "rice brown spot leaf",
    "banana_sigatoka": "banana black sigatoka leaf",
    "banana_panama": "banana panama disease",
    "cassava_mosaic": "cassava mosaic virus",
    "cassava_bacterial_blight": "cassava bacterial blight",
    "grape_downy_mildew": "grape downy mildew leaf",
    "grape_black_rot": "grape black rot",
    "cucumber_powdery_mildew": "cucumber powdery mildew",
    "apple_scab": "apple scab leaf",
    "citrus_canker": "citrus canker leaf",
    "eggplant_leaf": "eggplant leaf healthy",
    "tomato_healthy": "healthy tomato leaf",
    "rice_healthy": "healthy rice leaf",
    "corn_healthy": "healthy corn leaf",
}

MAX_PER_QUERY = 2


def digest(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    seen = {digest(p) for p in MINE.glob("*") if p.suffix.lower() in (".jpg", ".png", ".jpeg")}

    ok = skip = fail = 0
    for name, query in QUERIES.items():
        try:
            hits = commons_hits(query, limit=MAX_PER_QUERY * 3)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3)
                try:
                    hits = commons_hits(query, limit=MAX_PER_QUERY * 3)
                except Exception as e2:
                    print(f"[x] {name}: 429 retry {e2}")
                    fail += 1
                    continue
            else:
                print(f"[x] {name}: fetch {e}")
                fail += 1
                continue
        except Exception as e:
            print(f"[x] {name}: fetch {e}")
            fail += 1
            continue
        got = 0
        for url in hits:
            if got >= MAX_PER_QUERY:
                break
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "KrishiBondhuVision/0.2 (eval images)"})
                raw = urllib.request.urlopen(req, timeout=30, context=_ctx).read()
                if len(raw) > 5_000_000:
                    skip += 1
                    continue
                tmp = OUT / "_tmp"
                tmp.write_bytes(raw)
                if digest(tmp) in seen:
                    skip += 1
                    continue
                dest = OUT / f"{name}_{got + 1}.jpg"
                tmp.rename(dest)
                seen.add(digest(dest))
                print(f"[+] {dest.name}  {len(raw)//1024} KB")
                ok += 1
                got += 1
            except Exception as e:
                print(f"[x] {name}: {e}")
        if got == 0:
            fail += 1
        time.sleep(1)
    print(f"\nfetched={ok} dedup'd={skip} failed={fail}")


if __name__ == "__main__":
    main()