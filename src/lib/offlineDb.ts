import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "clinicapro-offline";
const DB_VERSION = 1;
const DATA_STORE = "data";
const SYNC_QUEUE_STORE = "syncQueue";

export interface SyncQueueItem {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  recordId?: string;
  createdAt: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(DATA_STORE)) {
          db.createObjectStore(DATA_STORE);
        }
        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ---- Data Cache ----

export async function getCachedData(key: string): Promise<Record<string, unknown>[] | null> {
  try {
    const db = await getDb();
    const result = await db.get(DATA_STORE, key);
    return result ?? null;
  } catch {
    return null;
  }
}

export async function setCachedData(key: string, data: Record<string, unknown>[]) {
  try {
    const db = await getDb();
    await db.put(DATA_STORE, data, key);
  } catch (e) {
    console.error("Error caching data:", e);
  }
}

// ---- Sync Queue ----

export async function addToSyncQueue(item: Omit<SyncQueueItem, "id" | "createdAt">) {
  try {
    const db = await getDb();
    const entry: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    await db.put(SYNC_QUEUE_STORE, entry);
    return entry;
  } catch (e) {
    console.error("Error adding to sync queue:", e);
    return null;
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDb();
    return await db.getAll(SYNC_QUEUE_STORE);
  } catch {
    return [];
  }
}

export async function removeSyncQueueItem(id: string) {
  try {
    const db = await getDb();
    await db.delete(SYNC_QUEUE_STORE, id);
  } catch (e) {
    console.error("Error removing sync queue item:", e);
  }
}

export async function getSyncQueueCount(): Promise<number> {
  try {
    const db = await getDb();
    return await db.count(SYNC_QUEUE_STORE);
  } catch {
    return 0;
  }
}
