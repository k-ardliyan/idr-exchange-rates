import { load } from "cheerio";
import { request } from "undici";

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

export const scrapeBCA = async () => {
  const { body } = await request(BCA_URL);
  const html = await body.text();
  const $ = load(html);

  const rates: ExchangeRate[] = [];

  // Get dates from the table headers
  const extractDate = (rateType: string): string => {
    try {
      const labelElement = $(`label[rate-type="${rateType}"]`);
      const dateText = labelElement.text().trim();
      return dateText ? `${dateText} WIB` : "";
    } catch (e) {
      console.error(`Error extracting date for ${rateType}:`, e);
      return "";
    }
  };

  const eRateDate = extractDate("ERate");
  const ttCounterDate = extractDate("TT");
  const bankNotesDate = extractDate("BN");

  // Extract rates from table rows
  $("table.m-table-kurs tbody tr").each((_, el) => {
    const currency = $(el).attr("code") || "";

    // e-Rate
    const eRateBuy = parseFloat(
      $(el).find('p[rate-type="ERate-buy"]').text().replace(/,/g, "")
    );
    const eRateSell = parseFloat(
      $(el).find('p[rate-type="ERate-sell"]').text().replace(/,/g, "")
    );

    // TT Counter
    const ttCounterBuy = parseFloat(
      $(el).find('p[rate-type="TT-buy"]').text().replace(/,/g, "")
    );
    const ttCounterSell = parseFloat(
      $(el).find('p[rate-type="TT-sell"]').text().replace(/,/g, "")
    );

    // Bank Notes
    const bankNotesBuy = parseFloat(
      $(el).find('p[rate-type="BN-buy"]').text().replace(/,/g, "")
    );
    const bankNotesSell = parseFloat(
      $(el).find('p[rate-type="BN-sell"]').text().replace(/,/g, "")
    );

    rates.push({
      currency,
      eRate: {
        buy: eRateBuy,
        sell: eRateSell,
        date: eRateDate,
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
};
