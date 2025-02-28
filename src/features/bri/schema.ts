import { t } from "elysia";

const ExchangeRateSchema = t.Object({
  currency: t.String({
    description: "Currency code (e.g., USD, EUR, JPY)",
    example: "USD",
  }),
  eRate: t.Object({
    buy: t.Number({
      description: "e-Rate buy price in IDR",
      example: 16550,
    }),
    sell: t.Number({
      description: "e-Rate sell price in IDR",
      example: 16650,
    }),
    date: t.String({
      description: "Date when the e-Rate was updated in ISO format",
      example: "2025-03-01T04:30:00+07:00",
    }),
  }),
  ttCounter: t.Object({
    buy: t.Number({
      description: "TT Counter buy price in IDR",
      example: 16450,
    }),
    sell: t.Number({
      description: "TT Counter sell price in IDR",
      example: 16750,
    }),
    date: t.String({
      description: "Date when the TT Counter rate was updated in ISO format",
      example: "2025-03-01T04:30:00+07:00",
    }),
  }),
});

const DataSchema = t.Object({
  source: t.Object({
    name: t.String({
      description: "Source bank name of the exchange rates",
      example: "Bank BRI",
    }),
    url: t.String({
      description: "URL from which the data was scraped",
      example: "https://bri.co.id/kurs-detail",
    }),
  }),
  scrapedAt: t.String({
    description: "Timestamp of when the data was fetched",
    example: "2025-03-01T12:00:00.000Z",
  }),
  rateDates: t.Object({
    eRate: t.String({
      description: "Date of the e-Rate in ISO format",
      example: "2025-03-01T04:30:00+07:00",
    }),
    ttCounter: t.String({
      description: "Date of the TT Counter rate in ISO format",
      example: "2025-03-01T04:30:00+07:00",
    }),
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
    description: "Response message",
    example: "Failed to fetch exchange rates from Bank BRI",
  }),
  error: t.Object({
    type: t.String({
      description: "Type of error that occurred",
      example: "NetworkError",
    }),
    detail: t.String({
      description: "Detailed error message",
      example: "Failed to connect to the server",
    }),
    code: t.Number({
      description: "HTTP status code associated with the error",
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
