<div align="center">

# 🏦 IDR Exchange Rates API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![Made with Bun](https://img.shields.io/badge/Bun-v1.0.+-FBF0DF.svg?logo=bun)](https://bun.sh) [![Powered by TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Built with Elysia](https://img.shields.io/badge/Elysia-Latest-B355F9.svg)](https://elysiajs.com/)

A comprehensive API for real-time Indonesian Rupiah (IDR) exchange rates from multiple banking sources.

[Getting Started](#-getting-started) • [Documentation](#-api-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

## 📖 Overview

IDR Exchange Rates API is an open-source service that collects and provides exchange rates for the Indonesian Rupiah (IDR) from multiple trusted sources. The API is designed to be fast, reliable, and developer-friendly, making it easy to integrate currency exchange data into your applications.

### 🌟 Key Features

- **Multi-source Data Collection**: Exchange rates from:
  - 🏛️ Bank Indonesia (BI) - The central bank of Indonesia
  - 🏛️ Bank Central Asia (BCA) - Indonesia's largest private bank
  - 🏛️ Bank Mandiri - Indonesia's largest bank by assets
- **Real-time Data**: Latest exchange rates with timestamps
- **Consistent API Format**: Standardized JSON responses across all endpoints
- **Robust Error Handling**: Clear error messages and status codes
- **Extensive Documentation**: Interactive Swagger UI documentation
- **Performance Optimized**: Built with Bun and Elysia for maximum speed

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime (>= 1.0.0)

### Installation

The server will start at http://localhost:3000

## 📚 API Documentation

The API documentation is available via Swagger UI at `/docs`

### Endpoints

- GET `/docs` - View API documentation
- GET `/api/bi` - Retrieve Bank Indonesia exchange rates
- GET `/api/bca` - Retrieve Bank BCA exchange rates
- GET `/api/mandiri` - Retrieve Bank Mandiri exchange rates

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
/docs        - API Documentation
/api/bi      - Bank Indonesia exchange rates
/api/bca     - BCA Bank exchange rates
/api/mandiri - Mandiri Bank exchange rates
```
