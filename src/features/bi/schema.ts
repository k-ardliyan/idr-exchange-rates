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
  source: t.Object({
    name: t.String({
      description: "Name of the source institution",
      example: "Bank Indonesia",
    }),
    url: t.String({
      description: "URL of the source page for the exchange rates",
      example:
        "https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx",
    }),
  }),
  scrapedAt: t.String({
    description: "Timestamp of when the data was fetched (ISO 8601)",
    example: "2025-02-27T12:00:00.000Z",
  }),
  updated: t.String({
    description:
      "Same as scrapedAt; retained for clients that previously used this field name",
    example: "2025-02-27T12:00:00.000Z",
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
