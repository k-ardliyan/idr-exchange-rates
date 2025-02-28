import { fetch } from "bun";
import { load } from "cheerio";

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

/**
 * Parse number from string with proper handling of Indonesian/US format
 * Converts strings like "16,576.00" to 16576.00
 */
const parseNumber = (text: string): number => {
  // Remove spaces and convert to string
  const cleanText = text.trim();

  // Return 0 if empty
  if (!cleanText) return 0;

  // Simply remove commas and parse as float
  return parseFloat(cleanText.replace(/,/g, ""));
};

export const scrapeBNI = async () => {
  try {
    const response = await fetch(BNI_URL);
    const html = await response.text();
    const $ = load(html);

    const rates: ExchangeRate[] = [];
    const processedCurrencies = new Set<string>();

    // Extract dates from the date spans
    const specialRateDate = $("#dnn_ctr6796_BNIValasInfoView_lblDateCounter")
      .text()
      .replace("Last Updated:", "")
      .trim();

    const ttCounterDate = $("#dnn_ctr6796_BNIValasInfoView_lblDateBankNotes")
      .text()
      .replace("Last Updated:", "")
      .trim();

    const bankNotesDate = $("#dnn_ctr6796_BNIValasInfoView_lblDateSpecialRates")
      .text()
      .replace("Last Updated:", "")
      .trim();

    // Get all currency rows from the tables
    const specialRateRows = $(
      "#dnn_ctr6796_BNIValasInfoView_divCounter table tbody tr"
    );
    const ttCounterRows = $(
      "#dnn_ctr6796_BNIValasInfoView_divBankNotes table tbody tr"
    );
    const bankNotesRows = $(
      "#dnn_ctr6796_BNIValasInfoView_divSpecial table tbody tr"
    );

    // Process each currency in the Special Rates table
    specialRateRows.each((i, row) => {
      const tds = $(row).find("td");
      if (tds.length < 3) return; // Skip header rows

      // Extract currency name (removing the flag image)
      const currencyText = $(tds[0]).text().trim();
      const currency = currencyText.replace(/\s+/g, "");
      processedCurrencies.add(currency);

      // Parse the rates using our custom parser
      const specialRateBuy = parseNumber($(tds[1]).text());
      const specialRateSell = parseNumber($(tds[2]).text());

      // Find matching rows in the other tables
      const ttCounterRow = ttCounterRows.filter((_, el) => {
        const text = $(el).find("td:first-child").text().trim();
        return text.includes(currency);
      });

      const bankNotesRow = bankNotesRows.filter((_, el) => {
        const text = $(el).find("td:first-child").text().trim();
        return text.includes(currency);
      });

      // Extract TT Counter rates
      let ttCounterBuy = 0;
      let ttCounterSell = 0;
      if (ttCounterRow.length > 0) {
        const ttCells = $(ttCounterRow).find("td");
        ttCounterBuy = parseNumber($(ttCells[1]).text());
        ttCounterSell = parseNumber($(ttCells[2]).text());
      }

      // Extract Bank Notes rates
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
          date: specialRateDate,
        },
        ttCounter: {
          buy: ttCounterBuy,
          sell: ttCounterSell,
          date: ttCounterDate,
        },
        bankNotes: {
          buy: bankNotesBuy,
          sell: bankNotesSell,
          date: bankNotesDate,
        },
      });
    });

    // Process currencies that only appear in TT Counter or Bank Notes (CNY, AED, KRW)
    ttCounterRows.each((i, row) => {
      const tds = $(row).find("td");
      if (tds.length < 3) return; // Skip header rows

      // Extract currency name
      const currencyText = $(tds[0]).text().trim();
      const currency = currencyText.replace(/\s+/g, "");

      // Skip if already processed
      if (processedCurrencies.has(currency)) return;
      processedCurrencies.add(currency);

      // Parse the TT Counter rates
      const ttCounterBuy = parseNumber($(tds[1]).text());
      const ttCounterSell = parseNumber($(tds[2]).text());

      // Find matching row in Bank Notes
      const bankNotesRow = bankNotesRows.filter((_, el) => {
        const text = $(el).find("td:first-child").text().trim();
        return text.includes(currency);
      });

      // Extract Bank Notes rates
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
          date: ttCounterDate,
        },
        bankNotes: {
          buy: bankNotesBuy,
          sell: bankNotesSell,
          date: bankNotesDate,
        },
      });
    });

    return rates;
  } catch (error) {
    console.error("Error scraping BNI rates:", error);
    return [];
  }
};
