import { t } from "@sinclair/typebox";

const ExchangeRateSchema = t.Object({
  currency: t.String({
    description: "Currency code (e.g., USD, EUR, JPY)",
    example: "USD",
  }),
  specialRate: t.Object({
    buy: t.Number({
      description: "Special rate buy price in IDR",
      example: 15650,
    }),
    sell: t.Number({
      description: "Special rate sell price in IDR",
      example: 15750,
    }),
    date: t.String({
      description: "Date when the special rate was updated",
      example: "27/02/25 - 10:00 WIB",
    }),
  }),
  ttCounter: t.Object({
    buy: t.Number({
      description: "TT Counter buy price in IDR",
      example: 15600,
    }),
    sell: t.Number({
      description: "TT Counter sell price in IDR",
      example: 15800,
    }),
    date: t.String({
      description: "Date when the TT Counter rate was updated",
      example: "27/02/25 - 10:00 WIB",
    }),
  }),
  bankNotes: t.Object({
    buy: t.Number({
      description: "Bank Notes buy price in IDR",
      example: 15550,
    }),
    sell: t.Number({
      description: "Bank Notes sell price in IDR",
      example: 15850,
    }),
    date: t.String({
      description: "Date when the Bank Notes rate was updated",
      example: "27/02/25 - 10:00 WIB",
    }),
  }),
});

const DataSchema = t.Object({
  source: t.String({
    description: "Source bank of the exchange rates",
    example: "Bank Mandiri",
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
    example: "Failed to fetch exchange rates from Bank Mandiri",
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

export { ExchangeRateSchema, DataSchema, SuccessResponseSchema, ErrorResponseSchema };
