import { load } from "cheerio";
import {
  assertNoAntiBotChallengePage,
  politeFetch,
} from "../../utils/scraper";
import { scrapeKursWebBankFallback } from "../../utils/kurs-web-fallback";

const BCA_URL = "https://www.bca.co.id/en/informasi/kurs";
const BCA_FALLBACK_SLUG = "bca";

interface ExchangeRate {
  currency: string;
  eRate: {
    buy: number;
    sell: number;
    date: string;
  };
  ttCounter: {
    buy: number;
    sell: number;
    date: string;
  };
  bankNotes: {
    buy: number;
    sell: number;
    date: string;
  };
}

type BcaScrapeResult = {
  sourceUrl: string;
  rates: ExchangeRate[];
  rateDates: {
    eRate: string;
    ttCounter: string;
    bankNotes: string;
  };
  sourceName?: string;
};

// Convert BCA date format "27 Feb 2025 / 10:00 WIB" to ISO format
const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";

    // Parse the date string - format: "27 Feb 2025 / 10:00 WIB"
    const regex =
      /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*\/\s*(\d{1,2}):(\d{2})\s*WIB/;
    const match = dateStr.match(regex);

    if (!match) return "";

    const [_, day, month, year, hour, minute] = match;

    // Map month names to numbers
    const months: Record<string, string> = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const monthNum = months[month];

    if (!monthNum) return "";

    // Format the ISO string with the +07:00 timezone offset (WIB)
    const dayPadded = parseInt(day).toString().padStart(2, "0");
    const hourPadded = parseInt(hour).toString().padStart(2, "0");
    const minutePadded = parseInt(minute).toString().padStart(2, "0");

    return `${year}-${monthNum}-${dayPadded}T${hourPadded}:${minutePadded}:00+07:00`;
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
};

const ensureDate = (value: string): string => {
  return value || new Date().toISOString();
};

const parsePrimaryAmount = (text: string): number => {
  const cleaned = text.replace(/[^\d.,-]/g, "").trim();
  if (!cleaned) return Number.NaN;

  const parsed = parseFloat(cleaned.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const parsePrimaryRates = (html: string): BcaScrapeResult => {
  assertNoAntiBotChallengePage(html, "BCA");

  const $ = load(html);
  const rates: ExchangeRate[] = [];

  const extractDate = (headerIndex: number): string => {
    try {
      const headerSpans = $(
        "th.header-column p.a-header-rate span.a-text-micro",
      );
      const dateText = headerSpans.eq(headerIndex).text().trim();
      if (!dateText) return "";
      return /\bWIB\b/i.test(dateText) ? dateText : `${dateText} WIB`;
    } catch (e) {
      console.error(`Error extracting date for header ${headerIndex}:`, e);
      return "";
    }
  };

  const eRateISO = ensureDate(convertToISODate(extractDate(0)));
  const ttCounterISO = ensureDate(convertToISODate(extractDate(1)));
  const bankNotesISO = ensureDate(convertToISODate(extractDate(2)));

  $("table.m-table-kurs tbody tr.m-table-body-row").each((_, el) => {
    const currencyAttr = $(el).attr("code") ?? "";
    const currencyText = $(el).find("td").first().text();
    const currency = (currencyAttr || currencyText).replace(/\s+/g, "").toUpperCase();
    if (!currency || currency === "CURRENCY") return;

    const eRateBuy = parsePrimaryAmount(
      $(el).find('td[rate-type="eRate-buy"] p').text(),
    );
    const eRateSell = parsePrimaryAmount(
      $(el).find('td[rate-type="eRate-sell"] p').text(),
    );

    const ttCounterBuy = parsePrimaryAmount(
      $(el).find('td[rate-type="TTCounter-buy"] p').text(),
    );
    const ttCounterSell = parsePrimaryAmount(
      $(el).find('td[rate-type="TTCounter-sell"] p').text(),
    );

    const bankNotesBuy = parsePrimaryAmount(
      $(el).find('td[rate-type="BankNotes-buy"] p').text(),
    );
    const bankNotesSell = parsePrimaryAmount(
      $(el).find('td[rate-type="BankNotes-sell"] p').text(),
    );

    if (
      !Number.isFinite(eRateBuy) ||
      !Number.isFinite(eRateSell) ||
      !Number.isFinite(ttCounterBuy) ||
      !Number.isFinite(ttCounterSell) ||
      !Number.isFinite(bankNotesBuy) ||
      !Number.isFinite(bankNotesSell)
    ) {
      return;
    }

    rates.push({
      currency,
      eRate: {
        buy: eRateBuy,
        sell: eRateSell,
        date: eRateISO,
      },
      ttCounter: {
        buy: ttCounterBuy,
        sell: ttCounterSell,
        date: ttCounterISO,
      },
      bankNotes: {
        buy: bankNotesBuy,
        sell: bankNotesSell,
        date: bankNotesISO,
      },
    });
  });

  if (rates.length === 0) {
    throw new Error(
      "BCA: no currency rows parsed from primary source (layout changed or blocked)",
    );
  }

  return {
    sourceUrl: BCA_URL,
    rates,
    rateDates: {
      eRate: eRateISO,
      ttCounter: ttCounterISO,
      bankNotes: bankNotesISO,
    },
  };
};

const parseFallbackRates = async (): Promise<BcaScrapeResult> => {
  const fallback = await scrapeKursWebBankFallback({
    slug: BCA_FALLBACK_SLUG,
    bankName: "Bank BCA",
  });

  const date = fallback.fetchedAt;
  const rates: ExchangeRate[] = fallback.rates.map((rate) => ({
    currency: rate.currency,
    eRate: {
      buy: rate.buy,
      sell: rate.sell,
      date,
    },
    ttCounter: {
      buy: rate.buy,
      sell: rate.sell,
      date,
    },
    bankNotes: {
      buy: rate.buy,
      sell: rate.sell,
      date,
    },
  }));

  return {
    sourceUrl: fallback.sourceUrl,
    sourceName: fallback.sourceName,
    rates,
    rateDates: {
      eRate: date,
      ttCounter: date,
      bankNotes: date,
    },
  };
};

export const scrapeBCA = async (): Promise<BcaScrapeResult> => {
  let primaryError: unknown;

  try {
    const primaryResponse = await politeFetch(BCA_URL, {
      timeoutMs: 10_000,
      retries: 0,
      minDelayMs: 120,
      maxDelayMs: 350,
    });
    const primaryHtml = await primaryResponse.text();
    return parsePrimaryRates(primaryHtml);
  } catch (error) {
    primaryError = error;
  }

  try {
    return await parseFallbackRates();
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
      `BCA: primary and fallback sources failed. primary=${primaryMsg}; fallback=${fallbackMsg}`,
    );
  }
};
