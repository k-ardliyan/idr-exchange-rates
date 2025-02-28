import { t } from "elysia";

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
    example: 16348.84,
  }),
  sell: t.Number({
    description: "Sell price in IDR",
    example: 16513.15,
  }),
  date: t.String({
    description: "Date when the rate was updated",
    example: "27 Februari 2025",
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

export {
  ExchangeRateSchema,
  DataSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
};
