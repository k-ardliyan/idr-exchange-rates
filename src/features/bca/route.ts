import { Elysia } from "elysia";
import { scrapeBCA } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";

export const bcaRoutes = new Elysia().get(
  "/bca",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await scrapeBCA();

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
      set.status = 500;

      // Create the structured error object
      const errorType =
        error instanceof Error ? error.constructor.name : "UnknownError";

      return {
        success: false,
        message: "Failed to fetch exchange rates from Bank BCA",
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
      summary: "BCA Exchange Rates",
      description:
        "Retrieves the latest exchange rates from BCA's website, including e-Rate, TT counter rates, and bank notes rates for multiple currencies.",
    },
  }
);
