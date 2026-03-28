import { scrapeBRI } from "./scraper";

const SOURCE_NAME = "Bank BRI";

export const fetchBRIRatesData = async () => {
  const { rates, sourceUrl, rateDates, sourceName } = await scrapeBRI();
  return {
    source: { name: sourceName || SOURCE_NAME, url: sourceUrl },
    scrapedAt: new Date().toISOString(),
    rateDates,
    rates,
  };
};
