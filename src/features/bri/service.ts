import { scrapeBRI } from "./scraper";

const SOURCE_NAME = "Bank BRI";

export const fetchBRIRatesData = async () => {
  const { rates, sourceUrl, rateDates } = await scrapeBRI();
  return {
    source: { name: SOURCE_NAME, url: sourceUrl },
    scrapedAt: new Date().toISOString(),
    rateDates,
    rates,
  };
};
