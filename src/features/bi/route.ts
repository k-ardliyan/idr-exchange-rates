import { createScrapeGetRoute } from "../../lib/create-scrape-route";
import { fetchBIRatesData } from "./service";

export const biRoutes = createScrapeGetRoute({
  name: "rates-bi",
  path: "/bi",
  summary: "Bank Indonesia Exchange Rates",
  description:
    "Retrieves the latest exchange rates from Bank Indonesia's website for multiple currencies. Responses may be served from a short-lived cache (~45s) to reduce load on upstream sites.",
  successResponseModel: "rates.biSuccess",
  successMessage: "Exchange rates retrieved successfully",
  failMessage: "Failed to fetch exchange rates from Bank Indonesia",
  scrape: fetchBIRatesData,
});
