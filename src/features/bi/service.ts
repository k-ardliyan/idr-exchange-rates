import { scrapeBI } from "./scraper";

const SOURCE_NAME = "Bank Indonesia";

export const fetchBIRatesData = async () => {
  const { rates, sourceUrl, sourceName } = await scrapeBI();
  const scrapedAt = new Date().toISOString();
  return {
    source: { name: sourceName || SOURCE_NAME, url: sourceUrl },
    scrapedAt,
    updated: scrapedAt,
    rates,
  };
};
