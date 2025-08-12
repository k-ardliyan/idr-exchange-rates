import { Elysia } from "elysia";
import { scrapeBCA } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";
import { withTimeout, mapErrorToHttp } from "../../utils/errors";

export const bcaRoutes = new Elysia().get(
  "/bca",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await withTimeout(
        scrapeBCA()
      );

      return {
        success: true,
        message: "Exchange rates retrieved successfully",
        data: {
          source: {
            name: "Bank BCA",
            url: sourceUrl,
          },
          scrapedAt: new Date().toISOString(),
          rateDates,
          rates,
        },
      };
    } catch (error) {
      const mapped = mapErrorToHttp(error);
      set.status = mapped.status;
      return {
        success: false,
        message: "Failed to fetch exchange rates from Bank BCA",
        error: {
          type: mapped.type,
          detail: mapped.detail,
          code: mapped.status,
        },
      };
    }
  },
  {
    response: {
      200: SuccessResponseSchema,
      500: ErrorResponseSchema,
      502: ErrorResponseSchema,
      504: ErrorResponseSchema,
    },
    detail: {
      summary: "BCA Exchange Rates",
      description:
        "Retrieves the latest exchange rates from BCA's website, including e-Rate, TT counter rates, and bank notes rates for multiple currencies.",
    },
  }
);
