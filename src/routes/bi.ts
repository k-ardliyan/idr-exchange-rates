import { Elysia } from "elysia";
import { scrapeBI } from "../services/scrapers/bi";
import { SuccessResponseSchema, ErrorResponseSchema } from "../schemas/bi";

export const biRoutes = new Elysia().get(
  "/bi",
  async ({ set }) => {
    try {
      const rates = await scrapeBI();
      return {
        success: true,
        message: "Exchange rates retrieved successfully",
        data: {
          source: "Bank Indonesia",
          updated: new Date().toISOString(),
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
        message: "Failed to fetch exchange rates from Bank Indonesia",
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
      summary: "Bank Indonesia Exchange Rates",
      description:
        "Retrieves the latest exchange rates from Bank Indonesia's website for multiple currencies.",
    },
  }
);
