import { t } from "elysia";

const ExchangeRateSchema = t.Object({
  currency: t.String({
    description: "Currency code (e.g., USD, EUR, JPY)",
    example: "USD",
  }),
  specialRate: t.Object({
    buy: t.Union(
      [
        t.Number({
          description: "Special rate buy price in IDR",
          example: 16515,
        }),
        t.Null(),
      ],
      {
        description: "Special rate buy price in IDR (null if not available)",
        example: 16515,
      }
    ),
    sell: t.Union(
      [
        t.Number({
          description: "Special rate sell price in IDR",
          example: 16540,
        }),
        t.Null(),
      ],
      {
        description: "Special rate sell price in IDR (null if not available)",
        example: 16540,
      }
    ),
    date: t.Union(
      [
        t.String({
          description: "Date when the special rate was updated in ISO format",
          example: "2025-02-28T11:05:00+07:00",
        }),
        t.Null(),
      ],
      {
        description:
          "Date when the special rate was updated in ISO format (null if not available)",
        example: "2025-02-28T11:05:00+07:00",
      }
    ),
  }),
  ttCounter: t.Object({
    buy: t.Number({
      description: "TT Counter buy price in IDR",
      example: 16275,
    }),
    sell: t.Number({
      description: "TT Counter sell price in IDR",
      example: 16625,
    }),
    date: t.String({
      description: "Date when the TT Counter rate was updated in ISO format",
      example: "2025-02-28T11:05:00+07:00",
    }),
  }),
  bankNotes: t.Object({
    buy: t.Number({
      description: "Bank Notes buy price in IDR",
      example: 16275,
    }),
    sell: t.Number({
      description: "Bank Notes sell price in IDR",
      example: 16625,
    }),
    date: t.String({
      description: "Date when the Bank Notes rate was updated in ISO format",
      example: "2025-02-28T11:05:00+07:00",
    }),
  }),
});

const DataSchema = t.Object({
  source: t.Object({
    name: t.String({
      description: "Name of the source bank",
      example: "Bank BNI",
    }),
    url: t.String({
      description: "URL of the source page for the exchange rates",
      example: "https://www.bni.co.id/en-us/home/forex-information",
    }),
  }),
  scrapedAt: t.String({
    description: "Timestamp of when the data was fetched",
    example: "2025-02-27T12:00:00Z",
  }),
  rates: t.Array(ExchangeRateSchema),
  rateDates: t.Object({
    specialRate: t.String({
      description:
        "Date when all special rates were last updated in ISO format",
      example: "2025-02-28T11:05:00+07:00",
    }),
    ttCounter: t.String({
      description:
        "Date when all TT Counter rates were last updated in ISO format",
      example: "2025-02-28T11:05:00+07:00",
    }),
    bankNotes: t.String({
      description:
        "Date when all Bank Notes rates were last updated in ISO format",
      example: "2025-02-28T11:05:00+07:00",
    }),
  }),
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
    example: "Failed to fetch exchange rates from Bank BNI",
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
