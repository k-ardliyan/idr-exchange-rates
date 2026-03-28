import { load } from "cheerio";
import {
  assertNoAntiBotChallengePage,
  politeFetch,
} from "./scraper";

const KURS_WEB_BANK_BASE_URL = "https://kurs.web.id/bank";

export type KursWebFallbackRate = {
  currency: string;
  buy: number;
  sell: number;
  middleRate: number | null;
};

export type KursWebFallbackResult = {
  sourceUrl: string;
  sourceName: string;
  fetchedAt: string;
  rates: KursWebFallbackRate[];
};

type ScrapeKursWebBankFallbackOptions = {
  slug: string;
  bankName: string;
  timeoutMs?: number;
  retries?: number;
};

const parseKursWebNumber = (text: string): number => {
  const raw = text.replace(/[^\d.,-]/g, "").trim();
  if (!raw) return Number.NaN;

  if (raw.includes(",") && raw.includes(".")) {
    if (raw.lastIndexOf(",") > raw.lastIndexOf(".")) {
      const decimalComma = parseFloat(raw.replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(decimalComma)) return decimalComma;
    }

    const decimalDot = parseFloat(raw.replace(/,/g, ""));
    if (Number.isFinite(decimalDot)) return decimalDot;
  }

  if (raw.includes(",")) {
    const parts = raw.split(",");
    const lastPart = parts[parts.length - 1] ?? "";

    if (lastPart.length > 0 && lastPart.length <= 2) {
      const decimalComma = parseFloat(raw.replace(",", "."));
      if (Number.isFinite(decimalComma)) return decimalComma;
    }

    const thousandComma = parseFloat(raw.replace(/,/g, ""));
    if (Number.isFinite(thousandComma)) return thousandComma;
  }

  const direct = parseFloat(raw);
  if (Number.isFinite(direct)) return direct;

  const noDots = parseFloat(raw.replace(/\./g, ""));
  return Number.isFinite(noDots) ? noDots : Number.NaN;
};

const normalizeCurrencyCode = (text: string): string => {
  const normalized = text.replace(/\s+/g, " ").trim().toUpperCase();
  if (!normalized) return "";

  const match = normalized.match(/\b[A-Z]{3}\b/);
  if (match) return match[0];

  return normalized.replace(/[^A-Z]/g, "");
};

const convertKursWebDateToISO = (dateStr: string): string => {
  if (!dateStr) return "";

  const match = dateStr.match(
    /(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (match) {
    const [, year, month, day, hour, minute, second = "00"] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
  }

  const parsed = Date.parse(dateStr);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return "";
};

const ensureDate = (value: string): string => {
  return value || new Date().toISOString();
};

export const buildKursWebBankUrl = (slug: string): string => {
  return `${KURS_WEB_BANK_BASE_URL}/${slug}`;
};

export const scrapeKursWebBankFallback = async (
  options: ScrapeKursWebBankFallbackOptions,
): Promise<KursWebFallbackResult> => {
  const { slug, bankName, timeoutMs = 15_000, retries = 1 } = options;
  const sourceUrl = buildKursWebBankUrl(slug);

  const response = await politeFetch(sourceUrl, {
    timeoutMs,
    retries,
    minDelayMs: 100,
    maxDelayMs: 450,
    backoffMs: 300,
    maxBackoffMs: 1_500,
  });

  const html = await response.text();
  assertNoAntiBotChallengePage(html, `KURS.WEB ${bankName}`);

  const $ = load(html);
  const datetimeRaw = $("time[datetime]").first().attr("datetime") ?? "";
  const fetchedAt = ensureDate(convertKursWebDateToISO(datetimeRaw));

  const rates: KursWebFallbackRate[] = [];

  $("#kurstabel tbody tr").each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 3) return;

    const currency = normalizeCurrencyCode($(tds[0]).text());
    if (!currency || currency === "MATAUANG") return;

    const buy = parseKursWebNumber($(tds[1]).text());
    const sell = parseKursWebNumber($(tds[2]).text());
    const middleRateRaw = tds.length >= 4 ? parseKursWebNumber($(tds[3]).text()) : Number.NaN;

    if (!Number.isFinite(buy) || !Number.isFinite(sell)) return;

    rates.push({
      currency,
      buy,
      sell,
      middleRate: Number.isFinite(middleRateRaw) ? middleRateRaw : null,
    });
  });

  if (rates.length === 0) {
    throw new Error(`KURS.WEB ${bankName}: no currency rows parsed from fallback source`);
  }

  return {
    sourceUrl,
    sourceName: `${bankName} (fallback via kurs.web.id)`,
    fetchedAt,
    rates,
  };
};
