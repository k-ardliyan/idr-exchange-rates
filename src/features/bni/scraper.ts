import { load } from "cheerio";
import { politeFetch } from "../../utils/scraper";

const BNI_URL = "https://www.bni.co.id/en-us/home/forex-information";

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

const parseNumber = (text: string): number => {
  const cleanText = text.trim();
  if (!cleanText) return 0;
  return parseFloat(cleanText.replace(/,/g, ""));
};

const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";
    const regex =
      /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})\s+WIB\s+\(GMT\+(\d{2}):(\d{2})\)/;
    const match = dateStr.match(regex);
    if (!match) return "";
    const [, day, month, year, hour, minute, offsetHour, offsetMinute] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:00+${offsetHour}:${offsetMinute}`;
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
};

/** DNN module id on the page changes over time; do not hardcode `dnn_ctr6796`. */
const resolveBniViewBase = (html: string): string => {
  const m = html.match(/id="(dnn_ctr\d+_BNIValasInfoView)_divCounter"/);
  if (m) return m[1];
  const loose = html.match(/id="(dnn_ctr\d+_BNIValasInfoView)_/);
  if (loose) return loose[1];
  throw new Error("BNI: could not find BNIValasInfoView module id in HTML");
};

export const scrapeBNI = async () => {
  const response = await politeFetch(BNI_URL);
  const html = await response.text();
  const base = resolveBniViewBase(html);
  const $ = load(html);

  const errText = $(`#${base}_lblError`).text().trim();
  if (errText) {
    throw new Error(`BNI upstream error: ${errText.slice(0, 200)}`);
  }

  const rates: ExchangeRate[] = [];
  const processedCurrencies = new Set<string>();

  const specialRateDate = $(`#${base}_lblDateCounter`)
    .text()
    .replace("Last Updated:", "")
    .trim();
  const ttCounterDate = $(`#${base}_lblDateBankNotes`)
    .text()
    .replace("Last Updated:", "")
    .trim();
  const bankNotesDate = $(`#${base}_lblDateSpecialRates`)
    .text()
    .replace("Last Updated:", "")
    .trim();

  const specialRateISO = convertToISODate(specialRateDate);
  const ttCounterISO = convertToISODate(ttCounterDate);
  const bankNotesISO = convertToISODate(bankNotesDate);

  const specialRateRows = $(`#${base}_divCounter table tbody tr`);
  const ttCounterRows = $(`#${base}_divBankNotes table tbody tr`);
  const bankNotesRows = $(`#${base}_divSpecial table tbody tr`);

  specialRateRows.each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 3) return;

    const currencyText = $(tds[0]).text().trim();
    const currency = currencyText.replace(/\s+/g, "");
    if (!currency || currency === "CURRENCY") return;
    processedCurrencies.add(currency);

    const specialRateBuy = parseNumber($(tds[1]).text());
    const specialRateSell = parseNumber($(tds[2]).text());

    const ttCounterRow = ttCounterRows.filter((_, el) => {
      const text = $(el).find("td:first-child").text().trim();
      return text.includes(currency);
    });

    const bankNotesRow = bankNotesRows.filter((_, el) => {
      const text = $(el).find("td:first-child").text().trim();
      return text.includes(currency);
    });

    let ttCounterBuy = 0;
    let ttCounterSell = 0;
    if (ttCounterRow.length > 0) {
      const ttCells = $(ttCounterRow).find("td");
      ttCounterBuy = parseNumber($(ttCells[1]).text());
      ttCounterSell = parseNumber($(ttCells[2]).text());
    }

    let bankNotesBuy = 0;
    let bankNotesSell = 0;
    if (bankNotesRow.length > 0) {
      const bnCells = $(bankNotesRow).find("td");
      bankNotesBuy = parseNumber($(bnCells[1]).text());
      bankNotesSell = parseNumber($(bnCells[2]).text());
    }

    rates.push({
      currency,
      specialRate: {
        buy: specialRateBuy,
        sell: specialRateSell,
        date: specialRateISO,
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

  ttCounterRows.each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length < 3) return;

    const currencyText = $(tds[0]).text().trim();
    const currency = currencyText.replace(/\s+/g, "");
    if (!currency || currency === "CURRENCY") return;
    if (processedCurrencies.has(currency)) return;
    processedCurrencies.add(currency);

    const ttCounterBuy = parseNumber($(tds[1]).text());
    const ttCounterSell = parseNumber($(tds[2]).text());

    const bankNotesRow = bankNotesRows.filter((_, el) => {
      const text = $(el).find("td:first-child").text().trim();
      return text.includes(currency);
    });

    let bankNotesBuy = 0;
    let bankNotesSell = 0;
    if (bankNotesRow.length > 0) {
      const bnCells = $(bankNotesRow).find("td");
      bankNotesBuy = parseNumber($(bnCells[1]).text());
      bankNotesSell = parseNumber($(bnCells[2]).text());
    }

    rates.push({
      currency,
      specialRate: {
        buy: null,
        sell: null,
        date: null,
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
      "BNI: no currency rows parsed (page layout may have changed)",
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
