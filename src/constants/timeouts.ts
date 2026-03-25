/** Abort one `politeFetch` request if the bank is slow to respond */
export const HTTP_TIMEOUT_MS = 20_000;

/** Cap for the whole scrape (service) including retries/jitter inside `politeFetch` */
export const SCRAPE_TIMEOUT_MS = 35_000;
