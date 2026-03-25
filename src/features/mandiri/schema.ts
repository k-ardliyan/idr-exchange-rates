import { t } from "elysia";
import {
  ApiErrorResponseSchema,
  apiSuccessResponseSchema,
} from "../../models/api-response";

const ExchangeRateSchema = t.Object({
  currency: t.String({
    description: "Currency code (e.g., USD, EUR, JPY)",
    example: "USD",
  }),
  specialRate: t.Object({
    buy: t.Number({
      description: "Special rate buy price in IDR",
      example: 16515,
    }),
    sell: t.Number({
      description: "Special rate sell price in IDR",
      example: 16540,
    }),
    date: t.String({
      description: "Date when the special rate was updated in ISO format",
      example: "2025-02-27T03:00:00.000Z",
    }),
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
      example: "2025-02-27T03:00:00.000Z",
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
      example: "2025-02-27T03:00:00.000Z",
    }),
  }),
});

const DataSchema = t.Object({
  source: t.Object({
    name: t.String({
      description: "Source bank name of the exchange rates",
      example: "Bank Mandiri",
    }),
    url: t.String({
      description: "URL from which the data was scraped",
      example: "https://www.bankmandiri.co.id/kurs",
    }),
  }),
  scrapedAt: t.String({
    description: "Timestamp of when the data was fetched",
    example: "2025-02-27T12:00:00.000Z",
  }),
  rateDates: t.Object({
    specialRate: t.String({
      description: "Date of the special rate in ISO format",
      example: "2025-02-27T03:00:00.000Z",
    }),
    ttCounter: t.String({
      description: "Date of the TT Counter rate in ISO format",
      example: "2025-02-27T03:00:00.000Z",
    }),
    bankNotes: t.String({
      description: "Date of the Bank Notes rate in ISO format",
      example: "2025-02-27T03:00:00.000Z",
    }),
  }),
  rates: t.Array(ExchangeRateSchema),
});

const SuccessResponseSchema = apiSuccessResponseSchema(DataSchema);

export {
  ExchangeRateSchema,
  DataSchema,
  SuccessResponseSchema,
  ApiErrorResponseSchema as ErrorResponseSchema,
};
