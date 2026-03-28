import { scrapeBCA } from "./scraper";

const SOURCE_NAME = "Bank BCA";

export const fetchBCARatesData = async () => {
  const { rates, sourceUrl, rateDates, sourceName } = await scrapeBCA();
  return {
    source: { name: sourceName || SOURCE_NAME, url: sourceUrl },
    scrapedAt: new Date().toISOString(),
    rateDates,
    rates,
  };
};
