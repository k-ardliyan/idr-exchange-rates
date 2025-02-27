import { Elysia, t } from "elysia";
import { scrapeBI } from "../services/scrapers/bi";

// Define response schema for better Swagger documentation
const ExchangeRateSchema = t.Object({
  currency: t.String({
    description: "Currency code (e.g., USD, EUR, JPY)",
    example: "USD",
  }),
  currencyFullName: t.String({
    description: "Full name of currency",
    example: "US DOLLAR",
  }),
  value: t.Number({
    description: "Exchange rate base value",
    example: 1,
  }),
  buy: t.Number({
    description: "Buy price in IDR",
    example: 15650,
  }),
  sell: t.Number({
    description: "Sell price in IDR",
    example: 15750,
  }),
  date: t.String({
    description: "Date when the rate was updated",
    example: "27 Feb 2025",
  }),
});

const DataSchema = t.Object({
  source: t.String({
    description: "Source bank of the exchange rates",
    example: "Bank Indonesia",
  }),
  updated: t.String({
    description: "Timestamp of when the data was fetched",
    example: "2025-02-27T12:00:00Z",
  }),
  rates: t.Array(ExchangeRateSchema),
});

const SuccessResponseSchema = t.Object({
  success: t.Boolean({
    description: "Indicates if the request was successful",
    example: true,
  }),
  message: t.String({
    description: "Response message",
    example: "Exchange rates retrieved successfully",
  }),
  data: DataSchema,
});

const ErrorResponseSchema = t.Object({
  success: t.Boolean({
    description: "Indicates if the request was successful",
    example: false,
  }),
  message: t.String({
    description: "Error message description",
    example: "Failed to fetch exchange rates from Bank Indonesia",
  }),
  error: t.Object({
    type: t.String({
      description: "Type of error that occurred",
      example: "TimeoutError",
    }),
    detail: t.String({
      description: "Detailed error information",
      example: "Request took too long to respond",
    }),
    code: t.Number({
      description: "HTTP status code",
      example: 500,
    }),
  }),
});

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
