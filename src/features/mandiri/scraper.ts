import { fetch } from "bun";
import { load } from "cheerio";

const MANDIRI_URL = "https://www.bankmandiri.co.id/kurs";

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

// Convert date from "DD/MM/YY - HH:MM WIB" to ISO format "YYYY-MM-DDTHH:MM:SS.SSSZ"
const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";

    // Parse the date string - format: "28/02/25 - 09:00 WIB"
    const regex = /(\d{2})\/(\d{2})\/(\d{2})\s*-\s*(\d{2}):(\d{2})\s*WIB/;
    const match = dateStr.match(regex);

    if (!match) return "";

    const [_, day, month, year, hour, minute] = match;

    // Format the ISO string manually to correctly represent WIB timezone (UTC+7)
    const fullYear = 2000 + parseInt(year);
    const monthPadded = parseInt(month).toString().padStart(2, "0");
    const dayPadded = parseInt(day).toString().padStart(2, "0");
    const hourPadded = parseInt(hour).toString().padStart(2, "0");
    const minutePadded = parseInt(minute).toString().padStart(2, "0");

    // Create ISO string with the +07:00 timezone offset
    return `${fullYear}-${monthPadded}-${dayPadded}T${hourPadded}:${minutePadded}:00+07:00`;
  } catch (e) {
    console.error("Error converting date:", e);
    return "";
  }
};

export const scrapeMandiri = async () => {
  const response = await fetch(MANDIRI_URL);
  const html = await response.text();
  const $ = load(html);

  const rates: ExchangeRate[] = [];

  // Get dates from header - more robust extraction
  const extractDate = (headerIndex: number): string => {
    try {
      // Get the inner HTML of the header cell
      const headerCell = $(headers[headerIndex]);

      // Extract the text after the <br/> tag
      // This specifically targets the format where date is after <br/>
      const brTag = headerCell.find("br");
      if (brTag.length > 0) {
        // Get the text content after the <br/> tag
        const nextSibling = brTag[0].nextSibling;
        const dateText =
          nextSibling && nextSibling.type === "text"
            ? nextSibling.data?.trim() || ""
            : "";
        return dateText;
      }

      // Fallback: try to extract from the content structure
      const headerText = headerCell.text().trim();
      const dateMatch = headerText.match(
        /(\d{2}\/\d{2}\/\d{2}\s+-\s+\d{2}:\d{2}\s+WIB)/
      );
      return dateMatch ? dateMatch[1] : "";
    } catch (e) {
      console.error(`Error extracting date from header ${headerIndex}:`, e);
      return "";
    }
  };

  const headers = $("table thead tr:first-child th"); // Only get cells from first row
  const specialRateDate = extractDate(1); // Index 1 is "Special Rate*"
  const ttCounterDate = extractDate(2); // Index 2 is "TT Counter"
  const bankNotesDate = extractDate(3); // Index 3 is "Bank Notes"

  // Convert dates to ISO format
  const specialRateISO = convertToISODate(specialRateDate);
  const ttCounterISO = convertToISODate(ttCounterDate);
  const bankNotesISO = convertToISODate(bankNotesDate);

  $("table tbody tr").each((_, el) => {
    const tds = $(el).find("td");

    const currency = $(tds[0]).text().trim();

    // Special Rate
    const specialRateBuy = parseFloat(
      $(tds[1]).text().replace(/\./g, "").replace(/,/g, ".")
    );
    const specialRateSell = parseFloat(
      $(tds[2]).text().replace(/\./g, "").replace(/,/g, ".")
    );

    // TT Counter
    const ttCounterBuy = parseFloat(
      $(tds[3]).text().replace(/\./g, "").replace(/,/g, ".")
    );
    const ttCounterSell = parseFloat(
      $(tds[4]).text().replace(/\./g, "").replace(/,/g, ".")
    );

    // Bank Notes
    const bankNotesBuy = parseFloat(
      $(tds[5]).text().replace(/\./g, "").replace(/,/g, ".")
    );
    const bankNotesSell = parseFloat(
      $(tds[6]).text().replace(/\./g, "").replace(/,/g, ".")
    );

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

  return {
    sourceUrl: MANDIRI_URL,
    rates,
    rateDates: {
      specialRate: specialRateISO,
      ttCounter: ttCounterISO,
      bankNotes: bankNotesISO,
    },
  };
};
