import { createScrapeGetRoute } from "../../lib/create-scrape-route";
import { fetchBCARatesData } from "./service";

export const bcaRoutes = createScrapeGetRoute({
  name: "rates-bca",
  path: "/bca",
  summary: "BCA Exchange Rates",
  description:
    "Retrieves the latest exchange rates from BCA's website, including e-Rate, TT counter rates, and bank notes rates for multiple currencies. Responses may be served from a short-lived cache (~45s) to reduce load on upstream sites.",
  successResponseModel: "rates.bcaSuccess",
  successMessage: "Exchange rates retrieved successfully",
  failMessage: "Failed to fetch exchange rates from Bank BCA",
  scrape: fetchBCARatesData,
});
