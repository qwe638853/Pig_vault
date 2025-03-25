/**
 * 系統配置
 */

// 環境變量
const isDevelopment = process.env.NODE_ENV === 'development'

// API 基礎 URL
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:8000/api'
  : '/api' // 在生產環境中使用相對路徑，假設前端和後端部署在同一個域名下

// 鏈配置
export const CHAINS = [
  { title: 'Ethereum', value: 'ethereum' },
  { title: 'BSC', value: 'bsc' },
  { title: 'Polygon', value: 'polygon' },
  { title: 'Arbitrum', value: 'arbitrum' },
  { title: 'Optimism', value: 'optimism' }
]

// 代幣狀態閾值
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