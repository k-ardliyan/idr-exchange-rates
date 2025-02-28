import { t } from "elysia";

const ExchangeRateSchema = t.Object({
  currency: t.String({
    description: "Currency code (e.g., USD, EUR, JPY)",
    example: "USD",
  }),
  eRate: t.Object({
    buy: t.Number({
      description: "e-Rate buy price in IDR",
      example: 16555,
    }),
    sell: t.Number({
      description: "e-Rate sell price in IDR",
      example: 16575,
    }),
    date: t.String({
      description: "Date when the e-Rate was updated",
      example: "27 Feb 2025 / 10:00 WIB",
    }),
  }),
  ttCounter: t.Object({
    buy: t.Number({
      description: "TT Counter buy price in IDR",
      example: 16385,
    }),
    sell: t.Number({
      description: "TT Counter sell price in IDR",
      example: 16685,
    }),
    date: t.String({
      description: "Date when the TT Counter rate was updated",
      example: "27 Feb 2025 / 10:00 WIB",
    }),
  }),
  bankNotes: t.Object({
    buy: t.Number({
      description: "Bank Notes buy price in IDR",
      example: 16385,
    }),
    sell: t.Number({
      description: "Bank Notes sell price in IDR",
      example: 16685,
    }),
    date: t.String({
      description: "Date when the Bank Notes rate was updated",
      example: "27 Feb 2025 / 10:00 WIB",
    }),
  }),
});

const DataSchema = t.Object({
  source: t.String({
    description: "Source bank of the exchange rates",
    example: "Bank BCA",
  }),
  timestamp: t.String({
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
    example: "Failed to fetch exchange rates from Bank BCA",
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
