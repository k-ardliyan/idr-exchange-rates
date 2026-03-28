import { Elysia, status, type AnySchema } from "elysia";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { withTimeout, mapErrorToHttp } from "../utils/errors";

const DEFAULT_CACHE_TTL_MS = 45_000;
const DEFAULT_STALE_CACHE_DIR = ".cache/scrape";
const DEFAULT_STALE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 3;

type SuccessPayload = {
  success: true;
  message: string;
  data: unknown;
};

type Cached = { at: number; payload: SuccessPayload };

const isSuccessPayload = (value: unknown): value is SuccessPayload => {
  const payload = value as Partial<SuccessPayload> | null;
  return Boolean(
    payload &&
      payload.success === true &&
      typeof payload.message === "string" &&
      Object.prototype.hasOwnProperty.call(payload, "data"),
  );
};

const sanitizeFileName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
};

export type CreateScrapeGetRouteConfig = {
  /** Elysia plugin name for deduplication when `.use()`-ing multiple times */
  name: string;
  path: string;
  summary: string;
  description: string;
  /** Registered model name for 200 response (e.g. `rates.bcaSuccess`) */
  successResponseModel: string;
  successMessage: string;
  failMessage: string;
  scrape: () => Promise<unknown>;
  /** Response cache TTL in ms. Omit for default (~45s). Set `0` to disable. */
  cacheTtlMs?: number;
  /** Serve stale last-success payload if scrape fails due upstream issues. */
  allowStaleFallbackOnError?: boolean;
  /** Max stale age in ms; set 0 or negative for no age limit. */
  staleMaxAgeMs?: number;
  /** Optional message for stale fallback responses. */
  staleSuccessMessage?: string;
  /** Optional directory for persisted stale snapshots. */
  staleCacheDir?: string;
};

export const createScrapeGetRoute = (config: CreateScrapeGetRouteConfig) => {
  const ttl =
    config.cacheTtlMs === undefined ? DEFAULT_CACHE_TTL_MS : config.cacheTtlMs;
  const useStaleFallback = config.allowStaleFallbackOnError === true;
  const staleMaxAgeMs =
    config.staleMaxAgeMs === undefined
      ? DEFAULT_STALE_MAX_AGE_MS
      : config.staleMaxAgeMs;
  const staleSuccessMessage =
    config.staleSuccessMessage ||
    `${config.successMessage} (served from stale cache)`;
  const staleCacheDir = config.staleCacheDir || DEFAULT_STALE_CACHE_DIR;
  const stalePath = join(
    process.cwd(),
    staleCacheDir,
    `${sanitizeFileName(config.name)}.json`,
  );

  let cache: Cached | null = null;
  let persistedLoaded = false;

  const readPersistedCache = async (): Promise<Cached | null> => {
    try {
      const raw = await readFile(stalePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<Cached>;
      if (typeof parsed?.at !== "number" || !isSuccessPayload(parsed?.payload)) {
        return null;
      }
      return { at: parsed.at, payload: parsed.payload };
    } catch {
      return null;
    }
  };

  const writePersistedCache = async (nextCache: Cached): Promise<void> => {
    try {
      await mkdir(staleCacheDir, { recursive: true });
      await writeFile(stalePath, JSON.stringify(nextCache), "utf8");
    } catch {
      // Persistence failure should not break API response flow.
    }
  };

  return new Elysia({ name: config.name }).get(
    config.path,
    async () => {
      if (useStaleFallback && !persistedLoaded) {
        persistedLoaded = true;
        const persisted = await readPersistedCache();
        if (persisted) {
          cache = persisted;
        }
      }

      if (ttl > 0 && cache && Date.now() - cache.at < ttl) {
        return cache.payload;
      }

      try {
        const data = await withTimeout(config.scrape());
        const payload: SuccessPayload = {
          success: true,
          message: config.successMessage,
          data,
        };
        if (ttl > 0 || useStaleFallback) {
          cache = { at: Date.now(), payload };
          if (useStaleFallback) {
            await writePersistedCache(cache);
          }
        }
        return payload;
      } catch (error) {
        if (useStaleFallback && cache) {
          const age = Date.now() - cache.at;
          if (staleMaxAgeMs <= 0 || age <= staleMaxAgeMs) {
            return {
              ...cache.payload,
              message: staleSuccessMessage,
            };
          }
        }

        const mapped = mapErrorToHttp(error);
        return status(mapped.status, {
          success: false as const,
          message: config.failMessage,
          error: {
            type: mapped.type,
            detail: mapped.detail,
            code: mapped.status,
          },
        });
      }
    },
    {
      response: {
        200: config.successResponseModel as unknown as AnySchema,
        500: "api.errorResponse" as unknown as AnySchema,
        502: "api.errorResponse" as unknown as AnySchema,
        504: "api.errorResponse" as unknown as AnySchema,
      },
      detail: {
        summary: config.summary,
        description: config.description,
      },
    },
  );
};
