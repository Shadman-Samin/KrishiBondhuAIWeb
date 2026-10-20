import type { Advice, PredictionResult } from "@/lib/model-api";
import { DISEASES, MODEL_CLASS_TO_DISEASE } from "@/data/diseases";

export type ScanRecord = {
  id: string;
  createdAt: number;
  image: Blob;
  thumbnail: string;
  result: PredictionResult;
  advice: Advice | null;
};

export type PreparedScanImage = {
  image: Blob;
  thumbnail: string;
};

export const MAX_SCANS = 24;

const DB_NAME = "krishibondhu_local";
const DB_VERSION = 1;
const STORE = "scans";

export function newScanId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage"));
    request.onblocked = () => reject(new Error("Local storage is blocked"));
  });
}

function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage request failed"));
  });
}

export async function listScans(): Promise<ScanRecord[]> {
  const db = await openDb();
  try {
    const rows = await requestValue(db.transaction(STORE, "readonly").objectStore(STORE).getAll());
    return (rows as ScanRecord[]).sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    db.close();
  }
}

export async function saveScan(record: ScanRecord): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.put(record);

      const countRequest = store.count();
      countRequest.onsuccess = () => {
        let excess = countRequest.result - MAX_SCANS;
        if (excess <= 0) return;

        const cursorRequest = store.index("createdAt").openCursor();
        cursorRequest.onsuccess = () => {
          const cursor = cursorRequest.result;
          if (!cursor || excess <= 0) return;
          cursor.delete();
          excess -= 1;
          cursor.continue();
        };
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save scan"));
      tx.onabort = () => reject(tx.error ?? new Error("Could not save scan"));
    });
  } finally {
    db.close();
  }
}

export async function deleteScanRecord(id: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not delete scan"));
      tx.onabort = () => reject(tx.error ?? new Error("Could not delete scan"));
    });
  } finally {
    db.close();
  }
}

export async function clearScanRecords(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not clear scans"));
      tx.onabort = () => reject(tx.error ?? new Error("Could not clear scans"));
    });
  } finally {
    db.close();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function prepareScanImage(file: File): Promise<PreparedScanImage> {
  if (typeof document === "undefined" || typeof createImageBitmap !== "function") {
    return { image: file, thumbnail: "" };
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return { image: file, thumbnail: "" };

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const image = (await canvasToBlob(canvas, "image/jpeg", 0.82)) ?? file;

    const thumbSize = 96;
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = thumbSize;
    thumbCanvas.height = thumbSize;
    const thumbContext = thumbCanvas.getContext("2d");
    let thumbnail = "";
    if (thumbContext) {
      const coverScale = Math.max(thumbSize / bitmap.width, thumbSize / bitmap.height);
      const sourceWidth = thumbSize / coverScale;
      const sourceHeight = thumbSize / coverScale;
      const sourceX = (bitmap.width - sourceWidth) / 2;
      const sourceY = (bitmap.height - sourceHeight) / 2;

      thumbContext.fillStyle = "#ffffff";
      thumbContext.fillRect(0, 0, thumbSize, thumbSize);
      thumbContext.drawImage(
        bitmap,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        thumbSize,
        thumbSize,
      );
      thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.7);
    }

    return { image, thumbnail };
  } catch {
    return { image: file, thumbnail: "" };
  } finally {
    bitmap?.close();
  }
}

export function scanLabel(scan: ScanRecord) {
  if (!scan.result.top) {
    return { en: "No disease detected", bn: "কোনো রোগ শনাক্ত হয়নি" };
  }
  const index = MODEL_CLASS_TO_DISEASE[scan.result.top.class];
  const disease = index !== undefined ? DISEASES[index] : undefined;
  if (disease) {
    return { en: disease.name, bn: disease.nameBn };
  }
  const raw = scan.result.top.class.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { en: raw, bn: raw };
}

export function scanConfidence(scan: ScanRecord) {
  return scan.result.top ? Math.round(scan.result.top.conf * 100) : null;
}
