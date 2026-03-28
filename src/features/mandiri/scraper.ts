import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import {
  assertNoAntiBotChallengePage,
  politeFetch,
} from "../../utils/scraper";
import { scrapeKursWebBankFallback } from "../../utils/kurs-web-fallback";

const MANDIRI_URL = "https://www.bankmandiri.co.id/kurs";
const MANDIRI_FALLBACK_SLUG = "mandiri";

interface ExchangeRate {
  currency: string;
  specialRate: {
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

type RateDates = {
  specialRate: string;
  ttCounter: string;
  bankNotes: string;
};

type MandiriScrapeResult = {
  sourceUrl: string;
  rates: ExchangeRate[];
  rateDates: RateDates;
  sourceName?: string;
};

const parseAmount = (text: string): number => {
  const raw = text.replace(/[^\d.,-]/g, "").trim();
  if (!raw) return NaN;

  if (/^\d{1,3}(\.\d{3})+,\d{1,4}$/.test(raw)) {
    return parseFloat(raw.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
    return parseFloat(raw.replace(/,/g, ""));
  }

  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeCurrency = (raw: string): string => {
  const clean = raw.replace(/\s+/g, " ").trim().toUpperCase();
  if (!clean) return "";

  const code = clean.match(/\b[A-Z]{3}\b/);
  if (code) return code[0];

  return clean.replace(/[^A-Z]/g, "");
};

const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";

    const regex = /(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2}):(\d{2})\s*WIB/i;
    const match = dateStr.match(regex);
    if (!match) return "";

    const [, day, month, year, hour, minute] = match;

    const fullYear = 2000 + parseInt(year, 10);
    const monthPadded = parseInt(month, 10).toString().padStart(2, "0");
    const dayPadded = parseInt(day, 10).toString().padStart(2, "0");
    const hourPadded = parseInt(hour, 10).toString().padStart(2, "0");
    const minutePadded = parseInt(minute, 10).toString().padStart(2, "0");

    return `${fullYear}-${monthPadded}-${dayPadded}T${hourPadded}:${minutePadded}:00+07:00`;
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
};

const ensureDate = (value: string): string => {
  return value || new Date().toISOString();
};

const extractRateDates = ($: CheerioAPI): RateDates => {
  const dateRegex = /(\d{2}\/\d{2}\/\d{2}\s*-\s*\d{2}:\d{2}\s*WIB)/i;

  let specialDate = "";
  let ttDate = "";
  let bankNotesDate = "";

  $("table thead tr th").each((_, th) => {
    const text = $(th).text().replace(/\s+/g, " ").trim();
    if (!text) return;

    const dateMatch = text.match(dateRegex);
    if (!dateMatch?.[1]) return;

    const lower = text.toLowerCase();
    if (!specialDate && lower.includes("special")) {
      specialDate = dateMatch[1];
    }
    if (!ttDate && lower.includes("tt")) {
      ttDate = dateMatch[1];
    }
    if (!bankNotesDate && lower.includes("bank")) {
      bankNotesDate = dateMatch[1];
    }
  });

  const firstHeaderCells = $("table thead tr:first-child th");
  if (!specialDate) {
    specialDate = (firstHeaderCells.eq(1).text().match(dateRegex)?.[1] ?? "").trim();
  }
  if (!ttDate) {
    ttDate = (firstHeaderCells.eq(2).text().match(dateRegex)?.[1] ?? "").trim();
  }
  if (!bankNotesDate) {
    bankNotesDate =
      (firstHeaderCells.eq(3).text().match(dateRegex)?.[1] ?? "").trim();
  }

  return {
    specialRate: ensureDate(convertToISODate(specialDate)),
    ttCounter: ensureDate(convertToISODate(ttDate)),
    bankNotes: ensureDate(convertToISODate(bankNotesDate)),
  };
};

const asSafeNumber = (value: number): number => {
  return Number.isFinite(value) ? value : 0;
};

const parsePrimaryRates = (html: string): MandiriScrapeResult => {
  assertNoAntiBotChallengePage(html, "MANDIRI");

  const $ = load(html);
  const rates: ExchangeRate[] = [];

  const tableRows = $("table tbody tr");
  if (tableRows.length === 0) {
    throw new Error("MANDIRI: rate table rows not found in HTML");
  }

  const rateDates = extractRateDates($);

  tableRows.each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 7) return;

    const currency = normalizeCurrency($(tds[0]).text());
    if (!currency || currency === "CURRENCY") return;

    const specialRateBuy = parseAmount($(tds[1]).text());
    const specialRateSell = parseAmount($(tds[2]).text());
    const ttCounterBuy = parseAmount($(tds[3]).text());
    const ttCounterSell = parseAmount($(tds[4]).text());
    const bankNotesBuy = parseAmount($(tds[5]).text());
    const bankNotesSell = parseAmount($(tds[6]).text());

    const numericCount = [
      specialRateBuy,
      specialRateSell,
      ttCounterBuy,
      ttCounterSell,
      bankNotesBuy,
      bankNotesSell,
    ].filter((value) => Number.isFinite(value)).length;

    if (numericCount < 2) return;

    rates.push({
      currency,
      specialRate: {
        buy: asSafeNumber(specialRateBuy),
        sell: asSafeNumber(specialRateSell),
        date: rateDates.specialRate,
      },
      ttCounter: {
        buy: asSafeNumber(ttCounterBuy),
        sell: asSafeNumber(ttCounterSell),
        date: rateDates.ttCounter,
      },
      bankNotes: {
        buy: asSafeNumber(bankNotesBuy),
        sell: asSafeNumber(bankNotesSell),
        date: rateDates.bankNotes,
      },
    });
  });

  if (rates.length === 0) {
    throw new Error(
      "MANDIRI: no currency rows parsed (upstream layout changed or access is blocked)",
    );
  }

  return {
    sourceUrl: MANDIRI_URL,
    rates,
    rateDates,
  };
};

const parseFallbackRates = async (): Promise<MandiriScrapeResult> => {
  const fallback = await scrapeKursWebBankFallback({
    slug: MANDIRI_FALLBACK_SLUG,
    bankName: "Bank Mandiri",
  });

  const date = fallback.fetchedAt;
  const rates: ExchangeRate[] = fallback.rates.map((rate) => ({
    currency: rate.currency,
    specialRate: {
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
      specialRate: date,
      ttCounter: date,
      bankNotes: date,
    },
  };
};

export const scrapeMandiri = async (): Promise<MandiriScrapeResult> => {
  let primaryError: unknown;

  try {
    const response = await politeFetch(MANDIRI_URL, {
      timeoutMs: 12_000,
      retries: 1,
      minDelayMs: 150,
      maxDelayMs: 500,
      backoffMs: 400,
      maxBackoffMs: 1_500,
    });
    const html = await response.text();
    return parsePrimaryRates(html);
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
      `MANDIRI: primary and fallback sources failed. primary=${primaryMsg}; fallback=${fallbackMsg}`,
    );
  }
};
