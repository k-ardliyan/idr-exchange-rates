import { load } from "cheerio";
import type { Element } from "domhandler";
import { politeFetch } from "../../utils/scraper";

const BRI_URL = "https://bri.co.id/kurs-detail";

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

/** BRI uses Indonesian formatting: `16.888,00` (dot thousands, comma decimal). */
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
    const regex = /(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
    const match = dateStr.match(regex);
    if (!match) return "";
    const [, day, month, year, hour, minute] = match;
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
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
};

const mergeErate = (
  rates: ExchangeRate[],
  currency: string,
  buy: number,
  sell: number,
  isoDate: string,
) => {
  const existing = rates.find((r) => r.currency === currency);
  if (existing) {
    existing.eRate = { buy, sell, date: isoDate };
  } else {
    rates.push({
      currency,
      eRate: { buy, sell, date: isoDate },
      ttCounter: { buy: 0, sell: 0, date: isoDate },
    });
  }
};

const mergeTt = (
  rates: ExchangeRate[],
  currency: string,
  buy: number,
  sell: number,
  isoDate: string,
) => {
  const existing = rates.find((r) => r.currency === currency);
  if (existing) {
    existing.ttCounter = { buy, sell, date: isoDate };
  } else {
    rates.push({
      currency,
      eRate: { buy: 0, sell: 0, date: isoDate },
      ttCounter: { buy, sell, date: isoDate },
    });
  }
};

export const scrapeBRI = async () => {
  const response = await politeFetch(BRI_URL);
  const html = await response.text();

  if (html.length < 8000 || !html.includes("tab-e-rate")) {
    throw new Error(
      "BRI: rate page HTML too small or missing tables (blocked or layout changed)",
    );
  }

  const $ = load(html);
  const rates: ExchangeRate[] = [];

  let dateText = "";
  const coverText = $(".cover-text").text().trim();
  const dateRegex =
    /Terakhir diperbarui\s+(\d{1,2}\/[A-Za-z]{3}\/\d{4}\s+\d{1,2}:\d{2})/;
  const dateMatch = coverText.match(dateRegex);
  if (dateMatch) dateText = dateMatch[1];

  const isoDate = dateText
    ? convertToISODate(dateText)
    : new Date().toISOString();

  const rowHandler = (el: Element, kind: "eRate" | "ttCounter") => {
    const row = $(el);
    const currency = row.find(".box-country .text").text().trim();
    if (!currency) return;

    const buy = parseBriAmount(row.find("td").eq(1).text());
    const sell = parseBriAmount(row.find("td").eq(2).text());
    if (!Number.isFinite(buy) || !Number.isFinite(sell)) return;

    if (kind === "eRate") {
      mergeErate(rates, currency, buy, sell, isoDate);
    } else {
      mergeTt(rates, currency, buy, sell, isoDate);
    }
  };

  $("#tab-e-rate table tbody tr").each((_, el) => rowHandler(el, "eRate"));
  $("#tab-tt-counter table tbody tr").each((_, el) =>
    rowHandler(el, "ttCounter"),
  );

  if (rates.length === 0) {
    throw new Error(
      "BRI: no currency rows parsed (selectors or format may have changed)",
    );
  }

  return {
    sourceUrl: BRI_URL,
    rates,
    rateDates: {
      eRate: isoDate,
      ttCounter: isoDate,
    },
  };
};
