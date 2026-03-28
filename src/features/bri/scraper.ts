import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import {
  assertNoAntiBotChallengePage,
  politeFetch,
} from "../../utils/scraper";
import { scrapeKursWebBankFallback } from "../../utils/kurs-web-fallback";

const BRI_URL = "https://bri.co.id/kurs-detail";
const BRI_FALLBACK_SLUG = "bri";

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
}

type BriScrapeResult = {
  sourceUrl: string;
  rates: ExchangeRate[];
  rateDates: {
    eRate: string;
    ttCounter: string;
  };
  sourceName?: string;
};

type RateKind = "eRate" | "ttCounter";
type RowSelection = ReturnType<CheerioAPI>;

const parseBriAmount = (raw: string): number => {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return NaN;

  if (/^\d{1,3}(\.\d{3})+,\d{1,4}$/.test(s)) {
    return parseFloat(s.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(,\d{3})*\.\d+$/.test(s)) {
    return parseFloat(s.replace(/,/g, ""));
  }

  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";

    const textMonthRegex =
      /(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
    const textMonthMatch = dateStr.match(textMonthRegex);
    if (textMonthMatch) {
      const [, day, month, year, hour, minute] = textMonthMatch;
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

      const dayPadded = parseInt(day, 10).toString().padStart(2, "0");
      const hourPadded = parseInt(hour, 10).toString().padStart(2, "0");
      const minutePadded = parseInt(minute, 10).toString().padStart(2, "0");

      return `${year}-${monthNum}-${dayPadded}T${hourPadded}:${minutePadded}:00+07:00`;
    }

    const numericMonthRegex =
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
    const numericMonthMatch = dateStr.match(numericMonthRegex);
    if (numericMonthMatch) {
      const [, day, month, year, hour, minute] = numericMonthMatch;
      const dayPadded = parseInt(day, 10).toString().padStart(2, "0");
      const monthPadded = parseInt(month, 10).toString().padStart(2, "0");
      const hourPadded = parseInt(hour, 10).toString().padStart(2, "0");
      const minutePadded = parseInt(minute, 10).toString().padStart(2, "0");
      return `${year}-${monthPadded}-${dayPadded}T${hourPadded}:${minutePadded}:00+07:00`;
    }

    return "";
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
};

const parsePrimaryRates = (html: string): BriScrapeResult => {
  assertNoAntiBotChallengePage(html, "BRI");

  const $ = load(html);
  const dateText = extractUpdateDateText($);
  const isoDate = convertToISODate(dateText) || new Date().toISOString();

  const rates = new Map<string, ExchangeRate>();

  parseRateRows(
    $,
    [
      "#tab-e-rate table tbody tr",
      "#tab-e-rate tbody tr",
      "#tab-e-rate tr",
      "[id*='e-rate'] table tbody tr",
      "[id*='e-rate'] tbody tr",
    ],
    "eRate",
    rates,
    isoDate,
  );

  parseRateRows(
    $,
    [
      "#tab-tt-counter table tbody tr",
      "#tab-tt-counter tbody tr",
      "#tab-tt-counter tr",
      "[id*='tt-counter'] table tbody tr",
      "[id*='tt-counter'] tbody tr",
    ],
    "ttCounter",
    rates,
    isoDate,
  );

  if (rates.size === 0) {
    throw new Error(
      "BRI: no currency rows parsed from primary source (layout changed or blocked)",
    );
  }

  return {
    sourceUrl: BRI_URL,
    rates: Array.from(rates.values()),
    rateDates: {
      eRate: isoDate,
      ttCounter: isoDate,
    },
  };
};

const parseFallbackRates = async (): Promise<BriScrapeResult> => {
  const fallback = await scrapeKursWebBankFallback({
    slug: BRI_FALLBACK_SLUG,
    bankName: "Bank BRI",
  });

  const isoDate = fallback.fetchedAt;
  const rates: ExchangeRate[] = fallback.rates.map((rate) => ({
    currency: rate.currency,
    eRate: {
      buy: rate.buy,
      sell: rate.sell,
      date: isoDate,
    },
    ttCounter: {
      buy: rate.buy,
      sell: rate.sell,
      date: isoDate,
    },
  }));

  return {
    sourceUrl: fallback.sourceUrl,
    sourceName: fallback.sourceName,
    rates,
    rateDates: {
      eRate: isoDate,
      ttCounter: isoDate,
    },
  };
};

const normalizeCurrency = (raw: string): string => {
  const clean = raw.replace(/\s+/g, " ").trim().toUpperCase();
  if (!clean) return "";

  const code = clean.match(/\b[A-Z]{3}\b/);
  if (code) return code[0];

  return clean.replace(/[^A-Z]/g, "");
};

const extractUpdateDateText = ($: CheerioAPI): string => {
  const regex =
    /Terakhir diperbarui\s+(\d{1,2}\/[A-Za-z]{3}\/\d{4}\s+\d{1,2}:\d{2})/i;

  const candidates = [
    $(".cover-text").first().text().trim(),
    $("main").text(),
    $("body").text(),
  ];

  for (const text of candidates) {
    if (!text) continue;
    const match = text.match(regex);
    if (match?.[1]) return match[1].trim();
  }

  return "";
};

const extractBuySell = (
  $: CheerioAPI,
  row: RowSelection,
): { buy: number; sell: number } | null => {
  const tds = row.find("td");

  const directBuy = parseBriAmount(tds.eq(1).text());
  const directSell = parseBriAmount(tds.eq(2).text());
  if (Number.isFinite(directBuy) && Number.isFinite(directSell)) {
    return { buy: directBuy, sell: directSell };
  }

  const values: number[] = [];
  tds.each((index, td) => {
    if (index === 0) return;
    const parsed = parseBriAmount($(td).text());
    if (Number.isFinite(parsed)) values.push(parsed);
  });

  if (values.length >= 2) {
    return { buy: values[0], sell: values[1] };
  }

  return null;
};

const upsertRate = (
  rates: Map<string, ExchangeRate>,
  currency: string,
  kind: RateKind,
  buy: number,
  sell: number,
  isoDate: string,
) => {
  const existing =
    rates.get(currency) ??
    ({
      currency,
      eRate: { buy: 0, sell: 0, date: isoDate },
      ttCounter: { buy: 0, sell: 0, date: isoDate },
    } satisfies ExchangeRate);

  if (kind === "eRate") {
    existing.eRate = { buy, sell, date: isoDate };
  } else {
    existing.ttCounter = { buy, sell, date: isoDate };
  }

  rates.set(currency, existing);
};

const parseRateRows = (
  $: CheerioAPI,
  selectors: string[],
  kind: RateKind,
  rates: Map<string, ExchangeRate>,
  isoDate: string,
) => {
  const seenRowKeys = new Set<string>();

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const row = $(el);
      const rowKey = row.text().replace(/\s+/g, " ").trim();
      if (!rowKey || seenRowKeys.has(rowKey)) return;
      seenRowKeys.add(rowKey);

      const rawCurrency =
        row.find(".box-country .text").first().text().trim() ||
        row.find("td").first().text().trim();
      const currency = normalizeCurrency(rawCurrency);
      if (!currency || currency === "CURRENCY") return;

      const pair = extractBuySell($, row);
      if (!pair) return;

      upsertRate(rates, currency, kind, pair.buy, pair.sell, isoDate);
    });
  }
};

export const scrapeBRI = async (): Promise<BriScrapeResult> => {
  let primaryError: unknown;

  try {
    const primaryResponse = await politeFetch(BRI_URL, {
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
      `BRI: primary and fallback sources failed. primary=${primaryMsg}; fallback=${fallbackMsg}`,
    );
  }
};
