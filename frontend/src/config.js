/**
 * System Configuration
 */

// Environment variables
const isDevelopment = process.env.NODE_ENV === 'development'

// API Base URL
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000/api'
  : '/api' // Use relative path in production, assuming frontend and backend are deployed under the same domain

// Chain configuration with chainIds for 1inch API
export const CHAINS = [
  { title: 'Ethereum', value: '1' },
  { title: 'BSC', value: '56' },
  { title: 'Polygon', value: '137' },
  { title: 'Arbitrum', value: '42161' },
  { title: 'Optimism', value: '10' },
  { title: 'Avalanche', value: '43114' },
  { title: 'Gnosis', value: '100' },
  { title: 'Base', value: '8453' }
]

// Token status thresholds
export const TOKEN_STATUS = {
  HIGH_VALUE: 100,
  MEDIUM_VALUE: 10,
  LOW_VALUE: 0
}

export default {
  API_BASE_URL,
  CHAINS,
  TOKEN_STATUS
} 