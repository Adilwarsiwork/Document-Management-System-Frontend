import { openDB, type IDBPDatabase } from "idb";

import type {
  DocumentSearchFilters,
  DocumentSearchPage,
  DocumentSearchResult,
} from "../pages/dashboard/types/document-search.types";

/**
 * Offline cache for recent search results.
 *
 * IndexedDB rather than localStorage: entries are read on every search, and
 * localStorage reads are synchronous, which would block the main thread on each
 * one. The stored links are long signed URLs, so a handful of pages can add up.
 *
 * Every operation resolves instead of rejecting. Storage can be unavailable
 * (private browsing, a locked-down profile, a quota error) and none of that
 * should be able to break search, which works perfectly well without a cache.
 */

const DB_NAME = "dms-offline";
const DB_VERSION = 1;
const STORE = "searchPages";

// How long a cached page stays usable once the network cannot be reached.
const TTL_MS = 12 * 60 * 60 * 1000;

// Upper bound on stored pages, applied newest-first so the cache cannot grow
// without limit across a long session.
const MAX_ENTRIES = 40;

export interface CachedSearchPage extends DocumentSearchPage {
  /** Milliseconds since the epoch, when this copy was written. */
  cachedAt: number;
}

interface StoredSearchPage extends CachedSearchPage {
  key: string;
}

function emptyPage(): CachedSearchPage {
  return { documents: [], total: 0, cachedAt: 0 };
}

let dbPromise: Promise<IDBPDatabase> | null = null;
let storageUnavailable = false;

function getDb(): Promise<IDBPDatabase> {
  if (storageUnavailable) return Promise.reject(new Error("storage unavailable"));
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Never recreate an existing store, or a version bump would wipe the cache.
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "key" });
          store.createIndex("cachedAt", "cachedAt");
        }
      },
    }).catch((error) => {
      storageUnavailable = true;
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

/**
 * A stable identity for one page of one search.
 *
 * Built from the known filter fields in a fixed order rather than by stringifying
 * the filter object, because key order in a JS object depends on insertion
 * order and two identical searches must produce the same key.
 */
export function searchPageKey(
  filters: DocumentSearchFilters,
  page: number,
): string {
  return JSON.stringify([
    filters.majorHead,
    filters.minorHead,
    // Tag order is not meaningful, so it is normalised out of the key.
    [...filters.tags].sort(),
    filters.fromDate,
    filters.toDate,
    filters.keyword.trim(),
    page,
  ]);
}

export function isCacheEntryFresh(cachedAt: number, now = Date.now()): boolean {
  return now - cachedAt < TTL_MS;
}

/** Drops anything past its age limit, then anything past the count limit. */
async function prune(db: IDBPDatabase, now: number): Promise<void> {
  const tx = db.transaction(STORE, "readwrite");
  const index = tx.store.index("cachedAt");
  let cursor = await index.openCursor();

  while (cursor) {
    if (now - cursor.value.cachedAt < TTL_MS) break;

    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;

  const count = await db.count(STORE);

  if (count <= MAX_ENTRIES) return;

  const trimTx = db.transaction(STORE, "readwrite");
  const trimIndex = trimTx.store.index("cachedAt");
  let excess = count - MAX_ENTRIES;
  let oldest = await trimIndex.openCursor();

  while (oldest && excess > 0) {
    await oldest.delete();
    excess -= 1;
    oldest = await oldest.continue();
  }

  await trimTx.done;
}

/** Writes one page of results, ignoring any storage failure. */
export async function saveSearchPage(
  filters: DocumentSearchFilters,
  page: number,
  result: DocumentSearchPage,
): Promise<void> {
  try {
    const db = await getDb();
    const now = Date.now();
    const entry: StoredSearchPage = {
      key: searchPageKey(filters, page),
      documents: result.documents,
      total: result.total,
      cachedAt: now,
    };

    const tx = db.transaction(STORE, "readwrite");
    await tx.store.put(entry);
    await tx.done;

    await prune(db, now);
  } catch {
    // A cache that cannot be written is not a search failure.
  }
}

/** Returns a cached page, or an empty page when there is nothing usable. */
export async function readSearchPage(
  filters: DocumentSearchFilters,
  page: number,
): Promise<CachedSearchPage> {
  try {
    const db = await getDb();
    const key = searchPageKey(filters, page);
    const entry = (await db.get(STORE, key)) as StoredSearchPage | undefined;

    if (!entry) return emptyPage();

    // Expired entries are treated as absent rather than deleted here, so a read
    // stays a single transaction and never blocks on cleanup.
    if (!isCacheEntryFresh(entry.cachedAt)) return emptyPage();

    return {
      documents: entry.documents ?? [],
      total: entry.total ?? 0,
      cachedAt: entry.cachedAt,
    };
  } catch {
    return emptyPage();
  }
}

export async function clearSearchCache(): Promise<void> {
  try {
    const db = await getDb();
    await db.clear(STORE);
  } catch {
    // Nothing to clear.
  }
}

export async function countCachedPages(): Promise<number> {
  try {
    const db = await getDb();

    return await db.count(STORE);
  } catch {
    return 0;
  }
}

/** Narrows an unknown stored value to something safe to render. */
export function isUsableCachedPage(
  value: CachedSearchPage,
): value is CachedSearchPage & { documents: DocumentSearchResult[] } {
  return Array.isArray(value.documents) && value.documents.length > 0;
}