import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import {
  assertNoAntiBotChallengePage,
  politeFetch,
} from "../../utils/scraper";
import { scrapeKursWebBankFallback } from "../../utils/kurs-web-fallback";

export const BI_URL =
  "https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx";
const BI_FALLBACK_SLUG = "bi";

interface BIExchangeRate {
  currency: string; // Now representing the currency code (e.g., "USD", "EUR")
  currencyFullName: string; // Now representing the full currency name
  value: number;
  buy: number;
  sell: number;
  date: string;
}

interface BiScraperOptions {
  currency?: string; // Currency code (e.g., "USD", "EUR")
  date?: string; // Date in DD-MM-YYYY format
}

export type BIscrapeResult = {
  rates: BIExchangeRate[];
  sourceUrl: string;
  sourceName?: string;
};

const parseBiNumber = (text: string): number => {
  const cleaned = text.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return Number.NaN;

  const parsed = parseFloat(cleaned.replace(/\./g, "").replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const scrapeBIPrimary = async (
  options: BiScraperOptions,
): Promise<BIscrapeResult> => {
  const initialResponse = await politeFetch(BI_URL, {
    timeoutMs: 12_000,
    retries: 0,
    minDelayMs: 120,
    maxDelayMs: 350,
  });
  const html = await initialResponse.text();
  assertNoAntiBotChallengePage(html, "BI");

  const $ = load(html);

  const dateText = $(".search-box-wrapper:contains('Update Terakhir')")
    .text()
    .trim();
  const dateMatch = dateText.match(/Update Terakhir\s+(.+)/);
  const currentDate = dateMatch
    ? dateMatch[1]
    : new Date().toLocaleDateString("id-ID");

  if (!options.currency && !options.date) {
    const rates = parseExchangeRates($, currentDate, false);
    if (rates.length === 0) {
      throw new Error("BI: no currency rows parsed from primary source");
    }

    return {
      rates,
      sourceUrl: BI_URL,
    };
  }

  const formData = new URLSearchParams();
  formData.append("__EVENTTARGET", "");
  formData.append("__EVENTARGUMENT", "");

  $("input[type=hidden]").each((_, el) => {
    const name = $(el).attr("name");
    const value = $(el).attr("value");
    if (name && value) {
      formData.append(name, value);
    }
  });

  if (options.currency) {
    formData.append(
      "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$ddlmatauang1",
      options.currency.trim().toUpperCase().padEnd(5, " "),
    );
  }

  formData.append(
    "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$btnSearch2",
    "Cari",
  );

  if (options.date) {
    formData.append(
      "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$txtTanggal",
      options.date,
    );
  }

  const response = await politeFetch(BI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: BI_URL,
    },
    body: formData.toString(),
    timeoutMs: 12_000,
    retries: 0,
    minDelayMs: 120,
    maxDelayMs: 350,
  });

  const filteredHtml = await response.text();
  assertNoAntiBotChallengePage(filteredHtml, "BI filtered result");

  const $filtered = load(filteredHtml);

  let filteredDate = currentDate;

  const filteredSpecificDate = $filtered(
    "#ctl00_PlaceHolderMain_g_6c89d4ad_107f_437d_bd54_8fda17b556bf_ctl00_lblKursTransaksiKTBI2",
  )
    .text()
    .trim();
  if (filteredSpecificDate) {
    filteredDate = filteredSpecificDate;
  } else {
    const filteredDateText = $filtered(
      ".search-box-wrapper:contains('Update Terakhir')",
    )
      .text()
      .trim();
    const filteredDateMatch = filteredDateText.match(/Update Terakhir\s+(.+)/);
    if (filteredDateMatch && filteredDateMatch[1]) {
      filteredDate = filteredDateMatch[1];
    }
  }

  const rates = parseExchangeRates($filtered, filteredDate, true);
  if (rates.length === 0) {
    throw new Error("BI: no currency rows parsed from filtered primary source");
  }

  return {
    rates,
    sourceUrl: BI_URL,
  };
};

const scrapeBIFallback = async (
  options: BiScraperOptions,
): Promise<BIscrapeResult> => {
  const fallback = await scrapeKursWebBankFallback({
    slug: BI_FALLBACK_SLUG,
    bankName: "Bank Indonesia",
  });

  const requestedCurrency = options.currency?.trim().toUpperCase();

  let rates: BIExchangeRate[] = fallback.rates.map((rate) => ({
    currency: rate.currency,
    currencyFullName: getCurrencyName(rate.currency),
    value: 1,
    buy: rate.buy,
    sell: rate.sell,
    date: fallback.fetchedAt,
  }));

  if (requestedCurrency) {
    rates = rates.filter((rate) => rate.currency === requestedCurrency);
    if (rates.length === 0) {
      throw new Error(
        `BI fallback: currency ${requestedCurrency} not found in fallback source`,
      );
    }
  }

  return {
    rates,
    sourceUrl: fallback.sourceUrl,
    sourceName: fallback.sourceName,
  };
};

export const scrapeBI = async (
  options: BiScraperOptions = {},
): Promise<BIscrapeResult> => {
  let primaryError: unknown;

  try {
    return await scrapeBIPrimary(options);
  } catch (error) {
    primaryError = error;
  }

  try {
    return await scrapeBIFallback(options);
  } catch (fallbackError) {
    const primaryMsg =
      primaryError instanceof Error
        ? primaryError.message
        : String(primaryError ?? "unknown primary error");
    const fallbackMsg =
      fallbackError instanceof Error
        ? fallbackError.message
        : String(fallbackError ?? "unknown fallback error");

    throw new Error(
      `BI: primary and fallback sources failed. primary=${primaryMsg}; fallback=${fallbackMsg}`,
    );
  }
};

function parseExchangeRates(
  $: CheerioAPI,
  date: string,
  isFiltered: boolean,
): BIExchangeRate[] {
  const rates: BIExchangeRate[] = [];

  // Select the appropriate table rows based on whether we're handling filtered or default results
  let rows;
  if (isFiltered) {
    // Filtered result table (with parameters)
    rows = $(
      "#ctl00_PlaceHolderMain_g_6c89d4ad_107f_437d_bd54_8fda17b556bf_ctl00_gvSearchResult1 tbody tr",
    );
    // Skip the header row (which is index 0)
    rows = rows.slice(1);
  } else {
    // Default table (no parameters)
    rows = $(".table tbody tr");
  }

  rows.each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 4) return;

    const currencyCode = $(tds[0]).text().trim();
    if (!currencyCode) return;

    const valueParsed = parseBiNumber($(tds[1]).text());
    const sellRate = parseBiNumber($(tds[2]).text());
    const buyRate = parseBiNumber($(tds[3]).text());

    if (!Number.isFinite(sellRate) || !Number.isFinite(buyRate)) return;

    const value = Number.isFinite(valueParsed) ? valueParsed : 1;

    rates.push({
      currency: currencyCode.trim(),
      currencyFullName: getCurrencyName(currencyCode.trim()),
      value,
      buy: buyRate,
      sell: sellRate,
      date,
    });
  });

  return rates;
}

// Helper function to get full currency names
function getCurrencyName(currencyFullName: string): string {
  const currencyMap: Record<string, string> = {
    AUD: "AUSTRALIAN DOLLAR",
    BND: "BRUNEI DOLLAR",
    CAD: "CANADIAN DOLLAR",
    CHF: "SWISS FRANC",
    CNH: "CHINA YUAN",
    CNY: "CHINA YUAN",
    DKK: "DANISH KRONE",
    EUR: "EURO",
    GBP: "BRITISH POUND",
    HKD: "HONGKONG DOLLAR",
    JPY: "JAPANESE YEN",
    KRW: "KOREAN WON",
    KWD: "KUWAITI DINAR",
    LAK: "LAOTIAN KIP",
    MYR: "MALAYSIAN RINGGIT",
    NOK: "NORWEGIAN KRONE",
    NZD: "NEW ZEALAND DOLLAR",
    PGK: "PAPUA N.G. KINA",
    PHP: "PHILIPPINES PESO",
    SAR: "SAUDI ARABIAN RIYAL",
    SEK: "SWEDISH KRONA",
    SGD: "SINGAPORE DOLLAR",
    THB: "THAI BAHT",
    USD: "US DOLLAR",
    VND: "VIETNAMESE DONG",
  };

  return currencyMap[currencyFullName.trim()] || currencyFullName.trim();
}
