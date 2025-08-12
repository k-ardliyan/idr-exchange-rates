import { Elysia } from "elysia";
import { scrapeMandiri } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";
import { withTimeout, mapErrorToHttp } from "../../utils/errors";

export const mandiriRoutes = new Elysia().get(
  "/mandiri",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await withTimeout(
        scrapeMandiri()
      );

      return {
        success: true,
        message: "Exchange rates retrieved successfully",
        data: {
          source: {
            name: "Bank Mandiri",
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
        message: "Failed to fetch exchange rates from Bank Mandiri",
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
      summary: "Bank Mandiri Exchange Rates",
      description:
        "Retrieves the latest exchange rates from Bank Mandiri's website, including special rates, TT counter rates, and bank notes rates for multiple currencies.",
    },
  }
);
