import { load } from "cheerio";
import { politeFetch } from "../../utils/scraper";

const BCA_URL = "https://www.bca.co.id/en/informasi/kurs";

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

export const scrapeBCA = async () => {
  const response = await politeFetch(BCA_URL);
  const html = await response.text();
  const $ = load(html);

  const rates: ExchangeRate[] = [];

  // Get dates from the table header spans
  // Format in HTML: "24 Dec 2025 / 12:47 WIB" inside p.a-header-rate > span.a-text-micro
  const extractDate = (headerIndex: number): string => {
    try {
      // The headers are in order: e-Rate (0), TT Counter (1), Bank Notes (2)
      const headerSpans = $(
        "th.header-column p.a-header-rate span.a-text-micro"
      );
      const dateText = headerSpans.eq(headerIndex).text().trim();
      return dateText ? `${dateText} WIB` : "";
    } catch (e) {
      console.error(`Error extracting date for header ${headerIndex}:`, e);
      return "";
    }
  };

  const eRateDate = extractDate(0);
  const ttCounterDate = extractDate(1);
  const bankNotesDate = extractDate(2);

  // Convert dates to ISO format
  const eRateISO = convertToISODate(eRateDate);
  const ttCounterISO = convertToISODate(ttCounterDate);
  const bankNotesISO = convertToISODate(bankNotesDate);

  // Extract rates from table rows
  // Row structure: <tr class="m-table-body-row" code="USD">
  $("table.m-table-kurs tbody tr.m-table-body-row").each((_, el) => {
    const currency = $(el).attr("code") || "";

    // e-Rate - td elements have rate-type attribute
    const eRateBuy = parseFloat(
      $(el).find('td[rate-type="eRate-buy"] p').text().replace(/,/g, "")
    );
    const eRateSell = parseFloat(
      $(el).find('td[rate-type="eRate-sell"] p').text().replace(/,/g, "")
    );

    // TT Counter
    const ttCounterBuy = parseFloat(
      $(el).find('td[rate-type="TTCounter-buy"] p').text().replace(/,/g, "")
    );
    const ttCounterSell = parseFloat(
      $(el).find('td[rate-type="TTCounter-sell"] p').text().replace(/,/g, "")
    );

    // Bank Notes
    const bankNotesBuy = parseFloat(
      $(el).find('td[rate-type="BankNotes-buy"] p').text().replace(/,/g, "")
    );
    const bankNotesSell = parseFloat(
      $(el).find('td[rate-type="BankNotes-sell"] p').text().replace(/,/g, "")
    );

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
