import { load } from "cheerio";
import type { CheerioAPI } from "cheerio";

const BI_URL =
  "https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/default.aspx";

interface BIExchangeRate {
  currency: string; // Now representing the currency code (e.g., "USD", "EUR")
  currencyFullName: string; // Now representing the full currency name
  value: number;
  buy: number;
  sell: number;
  date: string;
}

interface BiScraperOptions {
  currency?: string; // Currency code (e.g., "USD", "EUR")
  date?: string; // Date in DD-MM-YYYY format
}

export const scrapeBI = async (
  options: BiScraperOptions = {}
): Promise<BIExchangeRate[]> => {
  try {
    // First request to get the form tokens
    const initialResponse = await fetch(BI_URL);
    const html = await initialResponse.text();
    const $ = load(html);

    // Extract the date shown on the page
    const dateText = $(".search-box-wrapper:contains('Update Terakhir')")
      .text()
      .trim();
    const dateMatch = dateText.match(/Update Terakhir\s+(.+)/);
    const currentDate = dateMatch
      ? dateMatch[1]
      : new Date().toLocaleDateString("id-ID");

    // If no custom options, just parse the current page
    if (!options.currency && !options.date) {
      return parseExchangeRates($, currentDate, false);
    }

    // Otherwise, prepare for form submission with filters
    const formData = new URLSearchParams();

    // Required form fields
    formData.append("__EVENTTARGET", "");
    formData.append("__EVENTARGUMENT", "");

    // Extract hidden form fields (VIEWSTATE, etc.)
    $("input[type=hidden]").each((_, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value");
      if (name && value) {
        formData.append(name, value);
      }
    });

    // Set currency filter if provided
    if (options.currency) {
      formData.append(
        "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$ddlmatauang1",
        options.currency.trim().toUpperCase().padEnd(5, " ")
      );
    }

    // Set date filter if provided
    if (options.date) {
      formData.append(
        "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$txtTanggal",
        options.date
      );
      formData.append(
        "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$btnSearch2",
        "Cari"
      );
    } else {
      // Default to daily view
      formData.append(
        "ctl00$PlaceHolderMain$g_6c89d4ad_107f_437d_bd54_8fda17b556bf$ctl00$btnSearch2",
        "Cari"
      );
    }

    // Submit the form
    const response = await fetch(BI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: BI_URL,
      },
      body: formData.toString(),
    });

    const filteredHtml = await response.text();
    const $filtered = load(filteredHtml);

    // Extract date from filtered result - check both formats
    let filteredDate = currentDate;

    // Try to find date in the special date field that appears in filtered results
    const filteredSpecificDate = $filtered(
      "#ctl00_PlaceHolderMain_g_6c89d4ad_107f_437d_bd54_8fda17b556bf_ctl00_lblKursTransaksiKTBI2"
    )
      .text()
      .trim();
    if (filteredSpecificDate) {
      filteredDate = filteredSpecificDate;
    } else {
      // Fall back to standard date format
      const filteredDateText = $filtered(
        ".search-box-wrapper:contains('Update Terakhir')"
      )
        .text()
        .trim();
      const filteredDateMatch = filteredDateText.match(
        /Update Terakhir\s+(.+)/
      );
      if (filteredDateMatch && filteredDateMatch[1]) {
        filteredDate = filteredDateMatch[1];
      }
    }

    return parseExchangeRates($filtered, filteredDate, true);
  } catch (error) {
    console.error("Error scraping BI rates:", error);
    throw new Error(
      `Failed to scrape BI rates: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

function parseExchangeRates(
  $: CheerioAPI,
  date: string,
  isFiltered: boolean
): BIExchangeRate[] {
  const rates: BIExchangeRate[] = [];

  // Select the appropriate table rows based on whether we're handling filtered or default results
  let rows;
  if (isFiltered) {
    // Filtered result table (with parameters)
    rows = $(
      "#ctl00_PlaceHolderMain_g_6c89d4ad_107f_437d_bd54_8fda17b556bf_ctl00_gvSearchResult1 tbody tr"
    );
    // Skip the header row (which is index 0)
    rows = rows.slice(1);
  } else {
    // Default table (no parameters)
    rows = $(".table tbody tr");
  }

  rows.each((_, el) => {
    const tds = $(el).find("td");
    if (tds.length < 4) return;

    const currencyCode = $(tds[0]).text().trim();
    const value =
      parseFloat($(tds[1]).text().replace(/\./g, "").replace(/,/g, ".")) || 1;
    const sellRate = parseFloat(
      $(tds[2]).text().replace(/\./g, "").replace(/,/g, ".")
    );
    const buyRate = parseFloat(
      $(tds[3]).text().replace(/\./g, "").replace(/,/g, ".")
    );

    rates.push({
      currency: currencyCode.trim(),
      currencyFullName: getCurrencyName(currencyCode.trim()),
      value,
      buy: buyRate,
      sell: sellRate,
      date,
    });
  });

  return rates;
}

// Helper function to get full currency names
function getCurrencyName(currencyFullName: string): string {
  const currencyMap: Record<string, string> = {
    AUD: "AUSTRALIAN DOLLAR",
    BND: "BRUNEI DOLLAR",
    CAD: "CANADIAN DOLLAR",
    CHF: "SWISS FRANC",
    CNH: "CHINA YUAN",
    CNY: "CHINA YUAN",
    DKK: "DANISH KRONE",
    EUR: "EURO",
    GBP: "BRITISH POUND",
    HKD: "HONGKONG DOLLAR",
    JPY: "JAPANESE YEN",
    KRW: "KOREAN WON",
    KWD: "KUWAITI DINAR",
    LAK: "LAOTIAN KIP",
    MYR: "MALAYSIAN RINGGIT",
    NOK: "NORWEGIAN KRONE",
    NZD: "NEW ZEALAND DOLLAR",
    PGK: "PAPUA N.G. KINA",
    PHP: "PHILIPPINES PESO",
    SAR: "SAUDI ARABIAN RIYAL",
    SEK: "SWEDISH KRONA",
    SGD: "SINGAPORE DOLLAR",
    THB: "THAI BAHT",
    USD: "US DOLLAR",
    VND: "VIETNAMESE DONG",
  };

  return currencyMap[currencyFullName.trim()] || currencyFullName.trim();
}
