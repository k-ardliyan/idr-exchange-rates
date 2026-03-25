import { createScrapeGetRoute } from "../../lib/create-scrape-route";
import { fetchBRIRatesData } from "./service";

export const briRoutes = createScrapeGetRoute({
  name: "rates-bri",
  path: "/bri",
  summary: "BRI Exchange Rates",
  description:
    "Retrieves the latest exchange rates from BRI's website, including e-Rate and TT counter rates for multiple currencies. Responses may be served from a short-lived cache (~45s) to reduce load on upstream sites.",
  successResponseModel: "rates.briSuccess",
  successMessage: "Exchange rates retrieved successfully",
  failMessage: "Failed to fetch exchange rates from Bank BRI",
  scrape: fetchBRIRatesData,
});
