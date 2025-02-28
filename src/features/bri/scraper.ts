import { fetch } from "bun";
import { load } from "cheerio";

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

// Convert BRI date format "01/Mar/2025 04:30" to ISO format
const convertToISODate = (dateStr: string): string => {
  try {
    if (!dateStr) return "";

    // Parse the date string - format: "01/Mar/2025 04:30"
    const regex = /(\d{1,2})\/([A-Za-z]{3})\/(\d{4})\s+(\d{1,2}):(\d{2})/;
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

export const scrapeBRI = async () => {
  const response = await fetch(BRI_URL);
  const html = await response.text();
  const $ = load(html);

  const rates: ExchangeRate[] = [];

  // Extract the date from the page
  const dateString = $(".cover-text").text().trim();
  const dateRegex =
    /Terakhir diperbarui\s+(\d{1,2}\/[A-Za-z]{3}\/\d{4}\s+\d{1,2}:\d{2})/;
  const dateMatch = dateString.match(dateRegex);
  const dateText = dateMatch ? dateMatch[1] : "";
  const isoDate = convertToISODate(dateText);

  // Process eRate table
  $("#tab-e-rate table tbody tr").each((_, el) => {
    const currency = $(el).find(".box-country .text").text().trim();

    // e-Rate values
    const eRateBuy = parseFloat(
      $(el).find("td").eq(1).text().replace(/\./g, "").replace(",", ".")
    );
    const eRateSell = parseFloat(
      $(el).find("td").eq(2).text().replace(/\./g, "").replace(",", ".")
    );

    const existingRate = rates.find((rate) => rate.currency === currency);

    if (existingRate) {
      existingRate.eRate = {
        buy: eRateBuy,
        sell: eRateSell,
        date: isoDate,
      };
    } else {
      rates.push({
        currency,
        eRate: {
          buy: eRateBuy,
          sell: eRateSell,
          date: isoDate,
        },
        ttCounter: {
          buy: 0,
          sell: 0,
          date: isoDate,
        },
      });
    }
  });

  // Process ttCounter table
  $("#tab-tt-counter table tbody tr").each((_, el) => {
    const currency = $(el).find(".box-country .text").text().trim();

    // TT Counter values
    const ttCounterBuy = parseFloat(
      $(el).find("td").eq(1).text().replace(/\./g, "").replace(",", ".")
    );
    const ttCounterSell = parseFloat(
      $(el).find("td").eq(2).text().replace(/\./g, "").replace(",", ".")
    );

    const existingRate = rates.find((rate) => rate.currency === currency);

    if (existingRate) {
      existingRate.ttCounter = {
        buy: ttCounterBuy,
        sell: ttCounterSell,
        date: isoDate,
      };
    } else {
      rates.push({
        currency,
        eRate: {
          buy: 0,
          sell: 0,
          date: isoDate,
        },
        ttCounter: {
          buy: ttCounterBuy,
          sell: ttCounterSell,
          date: isoDate,
        },
      });
    }
  });

  return {
    sourceUrl: BRI_URL,
    rates,
    rateDates: {
      eRate: isoDate,
      ttCounter: isoDate,
    },
  };
};
