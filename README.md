<div align="center">

# 🏦 IDR Exchange Rates API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![Made with Bun](https://img.shields.io/badge/Bun-v1.0.+-FBF0DF.svg?logo=bun)](https://bun.sh) [![Powered by TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Built with Elysia](https://img.shields.io/badge/Elysia-Latest-B355F9.svg)](https://elysiajs.com/)

A fast, reliable API service providing real-time Indonesian Rupiah (IDR) exchange rates from multiple trusted banking sources.

[Getting Started](#-getting-started) • [Documentation](#-api-documentation) • [Contributing](#-contributing) • [License](#-license) • [Live Demo](https://idr-exchange-rates.onrender.com/docs)

<img src="https://img.shields.io/badge/BCA-blue?style=flat-square&logo=bank&logoColor=white">
<img src="https://img.shields.io/badge/Bank Indonesia-red?style=flat-square&logo=bank&logoColor=white">
<img src="https://img.shields.io/badge/BNI-orange?style=flat-square&logo=bank&logoColor=white">
<img src="https://img.shields.io/badge/Mandiri-yellow?style=flat-square&logo=bank&logoColor=white">

</div>

## 📖 Overview

IDR Exchange Rates API is an open-source service that collects and provides exchange rates for the Indonesian Rupiah (IDR) from multiple trusted sources. The API is designed to be fast, reliable, and developer-friendly, making it easy to integrate currency exchange data into your applications.

### 🌟 Key Features

- **Multi-source Data Collection**: Exchange rates from:
  - 🏛️ Bank Central Asia (BCA)
  - 🏛️ Bank Indonesia (BI)
  - 🏛️ Bank Negara Indonesia (BNI)
  - 🏛️ Bank Mandiri
- **Real-time Data**: Latest exchange rates with timestamps
- **Consistent API Format**: Standardized JSON responses across all endpoints
- **Robust Error Handling**: Clear error messages and status codes
- **Extensive Documentation**: Interactive Swagger UI documentation
- **Performance Optimized**: Built with Bun and Elysia for maximum speed

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime (>= 1.0.0)

### Installation

1. Clone the repository: `git clone https://github.com/k-ardliyan/idr-exchange-rates.git`
2. Navigate into the project directory: `cd idr-exchange-rates`
3. Install the dependencies: `bun install`
4. Start the server: `bun run start`

The server will start at http://localhost:3000

## 📚 API Documentation

The API documentation is available via Swagger UI at `/docs`

### Endpoints

- GET `/api/bca` - Retrieve Bank BCA exchange rates
- GET `/api/bi` - Retrieve Bank Indonesia exchange rates
- GET `/api/bni` - Retrieve Bank BNI exchange rates
- GET `/api/mandiri` - Retrieve Bank Mandiri exchange rates`
- GET `/docs` - View API documentation

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

- Bank BCA for providing exchange rate data
- Bank Indonesia for providing exchange rate data
- Bank BNI for providing exchange rate data
- Bank Mandiri for providing exchange rate data

## ⚠️ Disclaimer

Exchange rate information may not be 100% accurate and should not be used for financial decisions without verification. The developer is not responsible for any financial losses.

## 📧 Contact

For questions or concerns, please open an issue on the GitHub repository.

## 📊 Project Status: Active

File an issue, feature request, or pull request on the GitHub repository if you'd like to contribute!
