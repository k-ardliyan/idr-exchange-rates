import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";
import {
  assertNoAntiBotChallengePage,
  politeFetch,
} from "../../utils/scraper";

const BNI_URL = "https://www.bni.co.id/en-us/home/forex-information";
const BNI_FALLBACK_URL = "https://kurs.web.id/bank/bni";

interface ExchangeRate {
  currency: string;
  specialRate: {
    buy: number | null;
    sell: number | null;
    date: string | null;
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

type BniScrapeResult = {
  sourceUrl: string;
  rates: ExchangeRate[];
  rateDates: {
    specialRate: string;
    ttCounter: string;
    bankNotes: string;
  };
  sourceName?: string;
};

const parseNumber = (text: string): number => {
  const raw = text.replace(/[^\d.,-]/g, "").trim();
  if (!raw) return 0;

  if (/^\d{1,3}(\.\d{3})+,\d{1,4}$/.test(raw)) {
    return parseFloat(raw.replace(/\./g, "").replace(",", "."));
  }

  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
    return parseFloat(raw.replace(/,/g, ""));
  }

  const normalized = raw.replace(/,/g, ".");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";

    const withZone =
      /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s+WIB\s+\(GMT\+(\d{2}):(\d{2})\)/;
    const withZoneMatch = dateStr.match(withZone);
    if (withZoneMatch) {
      const [, day, month, year, hour, minute, offsetHour, offsetMinute] =
        withZoneMatch;
      return `${year}-${month}-${day}T${hour}:${minute}:00+${offsetHour}:${offsetMinute}`;
    }

    const simple = /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s*WIB/i;
    const simpleMatch = dateStr.match(simple);
    if (simpleMatch) {
      const [, day, month, year, hour, minute] = simpleMatch;
      return `${year}-${month}-${day}T${hour}:${minute}:00+07:00`;
    }

    const parsed = Date.parse(dateStr);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }

    return "";
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
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

const extractCurrencyCode = (text: string): string => {
  const normalized = text.replace(/\s+/g, " ").trim().toUpperCase();
  if (!normalized) return "";

  const codeMatch = normalized.match(/\b[A-Z]{3}\b/);
  if (codeMatch) return codeMatch[0];

  return normalized.replace(/[^A-Z]/g, "");
};

const resolveBniViewBase = (html: string, $: CheerioAPI): string | null => {
  const strict = html.match(
    /id=['"](dnn_ctr\d+_BNIValasInfoView)_divCounter['"]/i,
  );
  if (strict) return strict[1];

  const loose = html.match(/id=['"](dnn_ctr\d+_BNIValasInfoView)(?:_|['"])/i);
  if (loose) return loose[1];

  const candidateId = $(`[id*='BNIValasInfoView']`).first().attr("id") ?? "";
  const candidateMatch = candidateId.match(/(dnn_ctr\d+_BNIValasInfoView)/i);
  if (candidateMatch) return candidateMatch[1];

  return null;
};

type RowCollection = ReturnType<CheerioAPI>;

const firstNonEmptyText = ($: CheerioAPI, selectors: string[]): string => {
  for (const selector of selectors) {
    const text = $(selector).first().text().replace(/Last Updated:/i, "").trim();
    if (text) return text;
  }

  return "";
};

const pickRows = ($: CheerioAPI, selectors: string[]): RowCollection => {
  for (const selector of selectors) {
    const rows = $(selector);
    if (rows.length > 0) return rows;
  }

  return $("table.__missing__ tbody tr");
};

const parseRateRows = ($: CheerioAPI, rows: RowCollection) => {
  const map = new Map<string, { buy: number; sell: number }>();

  rows.each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 3) return;

    const currency = extractCurrencyCode($(tds[0]).text());
    if (!currency || currency === "CURRENCY") return;

    const buy = parseNumber($(tds[1]).text());
    const sell = parseNumber($(tds[2]).text());
    map.set(currency, { buy, sell });
  });

  return map;
};

const ensureDate = (isoDate: string): string => {
  return isoDate || new Date().toISOString();
};

const parsePrimaryRates = (html: string): BniScrapeResult => {
  assertNoAntiBotChallengePage(html, "BNI");

  const $ = load(html);
  const base = resolveBniViewBase(html, $);

  const errTextSelectors = base
    ? [`#${base}_lblError`, `[id='${base}_lblError']`]
    : ["[id$='_lblError']"];
  const errText = firstNonEmptyText($, errTextSelectors);
  if (errText) {
    throw new Error(`BNI upstream error: ${errText.slice(0, 200)}`);
  }

  const specialRateDate = firstNonEmptyText(
    $,
    base
      ? [`#${base}_lblDateCounter`, `[id='${base}_lblDateCounter']`]
      : ["[id$='_lblDateCounter']"],
  );
  const ttCounterDate = firstNonEmptyText(
    $,
    base
      ? [`#${base}_lblDateBankNotes`, `[id='${base}_lblDateBankNotes']`]
      : ["[id$='_lblDateBankNotes']"],
  );
  const bankNotesDate = firstNonEmptyText(
    $,
    base
      ? [`#${base}_lblDateSpecialRates`, `[id='${base}_lblDateSpecialRates']`]
      : ["[id$='_lblDateSpecialRates']"],
  );

  const specialRateISO = ensureDate(convertToISODate(specialRateDate));
  const ttCounterISO = ensureDate(convertToISODate(ttCounterDate));
  const bankNotesISO = ensureDate(convertToISODate(bankNotesDate));

  const specialRateRows = pickRows(
    $,
    base
      ? [
          `#${base}_divCounter table tbody tr`,
          `#${base}_divCounter tbody tr`,
          `#${base}_divCounter tr`,
        ]
      : [
          `[id$='_divCounter'] table tbody tr`,
          `[id$='_divCounter'] tbody tr`,
          `[id$='_divCounter'] tr`,
        ],
  );
  const ttCounterRows = pickRows(
    $,
    base
      ? [
          `#${base}_divBankNotes table tbody tr`,
          `#${base}_divBankNotes tbody tr`,
          `#${base}_divBankNotes tr`,
        ]
      : [
          `[id$='_divBankNotes'] table tbody tr`,
          `[id$='_divBankNotes'] tbody tr`,
          `[id$='_divBankNotes'] tr`,
        ],
  );
  const bankNotesRows = pickRows(
    $,
    base
      ? [
          `#${base}_divSpecial table tbody tr`,
          `#${base}_divSpecial tbody tr`,
          `#${base}_divSpecial tr`,
        ]
      : [
          `[id$='_divSpecial'] table tbody tr`,
          `[id$='_divSpecial'] tbody tr`,
          `[id$='_divSpecial'] tr`,
        ],
  );

  const specialMap = parseRateRows($, specialRateRows);
  const ttMap = parseRateRows($, ttCounterRows);
  const bankNotesMap = parseRateRows($, bankNotesRows);

  const currencies = new Set<string>([
    ...specialMap.keys(),
    ...ttMap.keys(),
    ...bankNotesMap.keys(),
  ]);

  const rates: ExchangeRate[] = [];

  currencies.forEach((currency) => {
    const special = specialMap.get(currency);
    const tt = ttMap.get(currency);
    const bankNotes = bankNotesMap.get(currency);

    rates.push({
      currency,
      specialRate: {
        buy: special?.buy ?? null,
        sell: special?.sell ?? null,
        date: special ? specialRateISO : null,
      },
      ttCounter: {
        buy: tt?.buy ?? 0,
        sell: tt?.sell ?? 0,
        date: ttCounterISO,
      },
      bankNotes: {
        buy: bankNotes?.buy ?? 0,
        sell: bankNotes?.sell ?? 0,
        date: bankNotesISO,
      },
    });
  });

  if (rates.length === 0) {
    throw new Error(
      "BNI: no currency rows parsed from primary source (layout changed or blocked)",
    );
  }

  return {
    sourceUrl: BNI_URL,
    rates,
    rateDates: {
      specialRate: specialRateISO,
      ttCounter: ttCounterISO,
      bankNotes: bankNotesISO,
    },
  };
};

const parseFallbackRates = (html: string): BniScrapeResult => {
  const $ = load(html);

  const fallbackDateRaw = $("time[datetime]").first().attr("datetime") ?? "";
  const fallbackDateISO = ensureDate(convertKursWebDateToISO(fallbackDateRaw));

  const rates: ExchangeRate[] = [];

  $("#kurstabel tbody tr").each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 3) return;

    const currency = extractCurrencyCode($(tds[0]).text());
    if (!currency || currency === "MATAUANG") return;

    const buy = parseNumber($(tds[1]).text());
    const sell = parseNumber($(tds[2]).text());

    rates.push({
      currency,
      specialRate: {
        buy: null,
        sell: null,
        date: null,
      },
      ttCounter: {
        buy,
        sell,
        date: fallbackDateISO,
      },
      bankNotes: {
        buy,
        sell,
        date: fallbackDateISO,
      },
    });
  });

  if (rates.length === 0) {
    throw new Error("BNI: no currency rows parsed from fallback source");
  }

  return {
    sourceUrl: BNI_FALLBACK_URL,
    sourceName: "Bank BNI (fallback via kurs.web.id)",
    rates,
    rateDates: {
      specialRate: fallbackDateISO,
      ttCounter: fallbackDateISO,
      bankNotes: fallbackDateISO,
    },
  };
};

export const scrapeBNI = async (): Promise<BniScrapeResult> => {
  let primaryError: unknown;

  try {
    const primaryResponse = await politeFetch(BNI_URL, {
      timeoutMs: 8_000,
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
    const fallbackResponse = await politeFetch(BNI_FALLBACK_URL, {
      timeoutMs: 15_000,
      retries: 1,
      minDelayMs: 100,
      maxDelayMs: 450,
      backoffMs: 300,
      maxBackoffMs: 1_500,
    });
    const fallbackHtml = await fallbackResponse.text();
    return parseFallbackRates(fallbackHtml);
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
      `BNI: primary and fallback sources failed. primary=${primaryMsg}; fallback=${fallbackMsg}`,
    );
  }
};
