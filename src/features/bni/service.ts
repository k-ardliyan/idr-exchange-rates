import { scrapeBNI } from "./scraper";

const SOURCE_NAME = "Bank BNI";

export const fetchBNIRatesData = async () => {
  const { rates, sourceUrl, rateDates } = await scrapeBNI();
  return {
    source: { name: SOURCE_NAME, url: sourceUrl },
    scrapedAt: new Date().toISOString(),
    rateDates,
    rates,
  };
};
