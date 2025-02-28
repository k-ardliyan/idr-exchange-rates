import { Elysia } from "elysia";
import { scrapeBCA } from "../services/scrapers/bca";
import { SuccessResponseSchema, ErrorResponseSchema } from "../schemas/bca";

export const bcaRoutes = new Elysia().get(
  "/bca",
  async ({ set }) => {
    try {
      const rates = await scrapeBCA();

      return {
        success: true,
        message: "Exchange rates retrieved successfully",
        data: {
          source: "Bank BCA",
          timestamp: new Date().toISOString(),
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
      summary: "Bank BCA Exchange Rates",
      description:
        "Retrieves the latest exchange rates from Bank BCA's website, including e-Rate, TT counter rates, and bank notes rates for multiple currencies.",
    },
  }
);
