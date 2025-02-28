import { Elysia } from "elysia";
import { scrapeBNI } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";

export const bniRoutes = new Elysia().get(
  "/bni",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await scrapeBNI();

      return {
        success: true,
        message: "Exchange rates retrieved successfully",
        data: {
          source: {
            name: "Bank BNI",
            url: sourceUrl,
          },
          scrapedAt: new Date().toISOString(),
          rateDates,
          rates,
        },
      };
    } catch (error) {
      set.status = 500;

      // Create the structured error object
      const errorType =
        error instanceof Error ? error.constructor.name : "UnknownError";

      return {
        success: false,
        message: "Failed to fetch exchange rates from Bank BNI",
        error: {
          type: errorType,
          detail:
            error instanceof Error ? error.message : "Unknown error occurred",
          code: 500,
        },
      };
    }
  },
  {
    response: {
      200: SuccessResponseSchema,
      500: ErrorResponseSchema,
    },
    detail: {
      summary: "BNI Exchange Rates",
      description:
        "Retrieves the latest exchange rates from BNI's website, including special rates, TT counter rates, and bank notes rates for multiple currencies.",
    },
  }
);
