# IDR Exchange Rates API

## 🏦 Overview

A web scraper and API to collect exchange rates of the Indonesian Rupiah (IDR) from multiple sources, including Bank Indonesia and major commercial banks. This project provides real-time exchange rate data through a clean RESTful API interface.

## ✨ Features

- Real-time exchange rate data scraping from:
  - 🏛️ Bank Indonesia (BI)
  - 🏛️ Bank Central Asia (BCA)
  - 🏛️ Bank Mandiri
- RESTful API with detailed documentation
- Consistent response format with proper error handling
- Comprehensive Swagger documentation

## 🚀 Getting Started

### Prerequisites

- Bun runtime (>= 1.0.0)

### Installation

The server will start at http://localhost:3000

## 📚 API Documentation

The API documentation is available via Swagger UI at `/docs`

### Endpoints

- GET `/bi` - Retrieve Bank Indonesia exchange rates
- GET `/bca` - Retrieve Bank BCA exchange rates
- GET `/mandiri` - Retrieve Bank Mandiri exchange rates

## 🛠️ Tech Stack

- Bun - JavaScript runtime & package manager
- Elysia - TypeScript web framework
- Cheerio - Server-side HTML parsing
- TypeScript - Type-safe JavaScript

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🙏 Acknowledgements

- Bank Indonesia for providing exchange rate data
- Bank BCA for providing exchange rate data
- Bank Mandiri for providing exchange rate data

## ⚠️ Disclaimer

Exchange rate information may not be 100% accurate and should not be used for financial decisions without verification. The developer is not responsible for any financial losses.

## 📧 Contact

For questions or concerns, please open an issue on the GitHub repository.

## 📊 Project Status: Active

File an issue, feature request, or pull request on the GitHub repository if you'd like to contribute!

## 🖥️ API Structure

```
/bi      - Bank Indonesia exchange rates
/bca     - BCA Bank exchange rates
/mandiri - Mandiri Bank exchange rates
/docs    - API Documentation
```
