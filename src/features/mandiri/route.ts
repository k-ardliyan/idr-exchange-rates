import { Elysia } from "elysia";
import { scrapeMandiri } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";

export const mandiriRoutes = new Elysia().get(
  "/mandiri",
  async ({ set }) => {
    try {
      const { rates, sourceUrl, rateDates } = await scrapeMandiri();

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
      set.status = 500;

      // Create the structured error object
      const errorType =
        error instanceof Error ? error.constructor.name : "UnknownError";

      return {
        success: false,
        message: "Failed to fetch exchange rates from Bank Mandiri",
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
      summary: "Bank Mandiri Exchange Rates",
      description:
        "Retrieves the latest exchange rates from Bank Mandiri's website, including special rates, TT counter rates, and bank notes rates for multiple currencies.",
    },
  }
);
