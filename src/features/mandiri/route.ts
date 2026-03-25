import { createScrapeGetRoute } from "../../lib/create-scrape-route";
import { fetchMandiriRatesData } from "./service";

export const mandiriRoutes = createScrapeGetRoute({
  name: "rates-mandiri",
  path: "/mandiri",
  summary: "Bank Mandiri Exchange Rates",
  description:
    "Retrieves the latest exchange rates from Bank Mandiri's website, including special rates, TT counter rates, and bank notes rates for multiple currencies. Responses may be served from a short-lived cache (~45s) to reduce load on upstream sites.",
  successResponseModel: "rates.mandiriSuccess",
  successMessage: "Exchange rates retrieved successfully",
  failMessage: "Failed to fetch exchange rates from Bank Mandiri",
  scrape: fetchMandiriRatesData,
});
