import { Elysia } from "elysia";
import { scrapeBRI } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";

export const briRoutes = new Elysia().get(
  "/bri",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await scrapeBRI();

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
      set.status = 500;

      // Create the structured error object
      const errorType =
        error instanceof Error ? error.constructor.name : "UnknownError";

      return {
        success: false,
        message: "Failed to fetch exchange rates from Bank BRI",
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
      summary: "BRI Exchange Rates",
      description:
        "Retrieves the latest exchange rates from BRI's website, including e-Rate and TT counter rates for multiple currencies.",
    },
  }
);
