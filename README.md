<div align="center">

# 🏦 IDR Exchange Rates API

[![Made with Bun](https://img.shields.io/badge/Bun-v1.0.+-FBF0DF.svg?logo=bun)](https://bun.sh) [![Powered by TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Built with Elysia](https://img.shields.io/badge/Elysia-Latest-B355F9.svg)](https://elysiajs.com/)

A learning project for building an IDR currency exchange rate API using Bun, Elysia, and TypeScript.

[Getting Started](#-getting-started) • [Documentation](#-api-documentation) • [Tech Stack](#️-tech-stack)

</div>

## 📖 Overview

> **📚 Learning Project**: This repository was created for learning and technology exploration purposes. It is not intended for production use or public interest.

IDR Exchange Rates API is a practice project to learn how to build a simple API that fetches currency exchange rates from various Indonesian banking sources.

### 🌟 Key Features

- **Multi-source Data Collection**: Exchange rates from:
  - 🏛️ Bank Central Asia (BCA)
  - 🏛️ Bank Indonesia (BI)
  - 🏛️ Bank Negara Indonesia (BNI)
  - 🏛️ Bank Rakyat Indonesia (BRI)
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
- GET `/api/bri` - Retrieve Bank BRI exchange rates
- GET `/api/mandiri` - Retrieve Bank Mandiri exchange rates
- GET `/docs` - View API documentation

## 🛠️ Tech Stack

- Bun - JavaScript runtime & package manager
- Elysia - TypeScript web framework
- Cheerio - Server-side HTML parsing
- TypeScript - Type-safe JavaScript

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This repository was created for learning purposes. The exchange rate data displayed may not be 100% accurate and **should not be used** as a reference for financial decisions. Always verify rates directly from the official bank sources.
