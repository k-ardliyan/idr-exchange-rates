import { Elysia, status, type AnySchema } from "elysia";
import { withTimeout, mapErrorToHttp } from "../utils/errors";

const DEFAULT_CACHE_TTL_MS = 45_000;

type SuccessPayload = {
  success: true;
  message: string;
  data: unknown;
};

type Cached = { at: number; payload: SuccessPayload };

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
};

export const createScrapeGetRoute = (config: CreateScrapeGetRouteConfig) => {
  const ttl =
    config.cacheTtlMs === undefined ? DEFAULT_CACHE_TTL_MS : config.cacheTtlMs;
  let cache: Cached | null = null;

  return new Elysia({ name: config.name }).get(
    config.path,
    async () => {
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
        if (ttl > 0) {
          cache = { at: Date.now(), payload };
        }
        return payload;
      } catch (error) {
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
