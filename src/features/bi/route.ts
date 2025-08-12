import { Elysia } from "elysia";
import { scrapeBI } from "./scraper";
import { SuccessResponseSchema, ErrorResponseSchema } from "./schema";
import { withTimeout, mapErrorToHttp } from "../../utils/errors";

export const biRoutes = new Elysia().get(
  "/bi",
  async ({ set }) => {
    try {
      const rates = await withTimeout(scrapeBI());
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
      const mapped = mapErrorToHttp(error);
      set.status = mapped.status;
      return {
        success: false,
        message: "Failed to fetch exchange rates from Bank Indonesia",
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
      summary: "Bank Indonesia Exchange Rates",
      description:
        "Retrieves the latest exchange rates from Bank Indonesia's website for multiple currencies.",
    },
  }
);
