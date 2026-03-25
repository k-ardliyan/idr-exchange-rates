import { scrapeMandiri } from "./scraper";

const SOURCE_NAME = "Bank Mandiri";

export const fetchMandiriRatesData = async () => {
  const { rates, sourceUrl, rateDates } = await scrapeMandiri();
  return {
    source: { name: SOURCE_NAME, url: sourceUrl },
    scrapedAt: new Date().toISOString(),
    rateDates,
    rates,
  };
};
