# Pig Vault

Small token management system to help users find and manage small tokens in their wallets.

## Features

- Connect Ethereum wallets (MetaMask)
- Display multi-chain token information (Ethereum, BSC, Polygon, Arbitrum, Optimism, etc.)
- Sort tokens by value, balance, and more
- Batch process selected tokens

## Project Structure

```
Pig_vault/
├── frontend/     # Vue 3 frontend
├── hardhat/      # Hardhat smart contracts
└── server/       # Express backend
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in the necessary information:
   ```
   PORT=3000
   INCH_API_KEY=your_1inch_api_key
   FRONTEND_URL=http://localhost:8080
   ```

   You can obtain a 1inch API key by registering at the [1inch Developer Portal](https://portal.1inch.dev).

4. Start the development server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run serve
   ```

4. Visit in your browser:
   ```
   http://localhost:8080
   ```

## 1inch API Integration

Pig Vault uses the following 1inch APIs:

- **Balance API (v1.2)** - Gets token balances for the connected wallet
- **Token API (v1.2)** - Fetches token metadata (symbol, name, decimals, logo)
- **Price API (v1.1)** - Gets current token prices for value calculation

The backend server proxies these requests and adds the required authentication headers.

## API Endpoints

### Get Token List

- **URL**: `GET /api/tokens/:chain/:address`
- **Description**: Get the list of tokens for a specified wallet address on a specific chain
- **Parameters**:
  - `chain`: Chain ID (1 for Ethereum, 56 for BSC, etc.)
  - `address`: Wallet address
- **Response**: JSON object containing token information with token address as keys

## Tech Stack

- **Frontend**:
  - Vue 3
  - Vuetify 3
  - Axios

- **Backend**:
  - Node.js
  - Express
  - Axios (for API proxy)

## Notes

- Please keep your API keys secure
- The 1inch API has rate limits, so we've implemented caching to reduce API calls
- Set up the correct CORS policy when deploying to production
- This application is for educational purposes only, do not store sensitive information in it

