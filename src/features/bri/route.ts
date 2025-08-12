import { Elysia } from "elysia";
import { scrapeBRI } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";
import { withTimeout, mapErrorToHttp } from "../../utils/errors";

export const briRoutes = new Elysia().get(
  "/bri",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await withTimeout(
        scrapeBRI()
      );

      return {
        success: true,
        message: "Exchange rates retrieved successfully",
        data: {
          source: {
            name: "Bank BRI",
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
        message: "Failed to fetch exchange rates from Bank BRI",
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
      summary: "BRI Exchange Rates",
      description:
        "Retrieves the latest exchange rates from BRI's website, including e-Rate and TT counter rates for multiple currencies.",
    },
  }
);
