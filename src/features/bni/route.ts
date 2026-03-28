import { createScrapeGetRoute } from "../../lib/create-scrape-route";
import { fetchBNIRatesData } from "./service";

export const bniRoutes = createScrapeGetRoute({
  name: "rates-bni",
  path: "/bni",
  summary: "BNI Exchange Rates",
  description:
    "Retrieves the latest exchange rates from BNI's website, including special rates, TT counter rates, and bank notes rates for multiple currencies. Responses may be served from a short-lived cache (~45s) to reduce load on upstream sites.",
  successResponseModel: "rates.bniSuccess",
  successMessage: "Exchange rates retrieved successfully",
  staleSuccessMessage:
    "Exchange rates retrieved successfully (stale cache fallback)",
  failMessage: "Failed to fetch exchange rates from Bank BNI",
  allowStaleFallbackOnError: true,
  staleMaxAgeMs: 1000 * 60 * 60 * 24 * 7,
  scrape: fetchBNIRatesData,
});
