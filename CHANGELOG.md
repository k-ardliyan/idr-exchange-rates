# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog.

## [2.1.0] - 2026-03-28

### Added
- Added a shared fallback scraper utility for kurs.web.id bank pages at /bank/<slug>.
- Added fallback support to all bank features: BCA, BI, BNI, BRI, and Mandiri.
- Added source labeling in responses so clients can see when fallback data is used.
- Added route-level stale cache fallback options to keep endpoints available during temporary upstream failures.

### Changed
- Updated BRI fallback source to use kurs.web.id/bank/bri for consistency with other bank fallbacks.
- Improved scraper resilience with stricter transient retry behavior and anti-bot challenge detection.
- Improved parser guards and date/number normalization in multiple bank scrapers.
- Bumped package version from 2.0.0 to 2.1.0.

### Notes
- Official upstream pages for some banks may return anti-bot or challenge pages in certain server environments.
- When primary scraping fails, the service now attempts fallback sources and can serve stale cached success responses if available.
