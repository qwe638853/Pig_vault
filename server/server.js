const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT 
const INCH_API_KEY = process.env.INCH_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL 

// 全局配置
const CONFIG = {
  // 緩存有效期
  CACHE_TTL: {
    TOKEN_DETAILS: 60 * 60 * 1000, // 1小時
    PRICE_DATA: 30 * 1000,         // 30秒 (提高到30秒避免頻繁API請求)
    BALANCE_DATA: 2 * 60 * 1000    // 2分鐘
  },
  // 重試配置
  RETRY: {
    MAX_RETRIES: 3,
    INITIAL_BACKOFF: 1000,  // 初始等待時間(毫秒)
    MAX_BACKOFF: 10000      // 最大等待時間(毫秒)
  },
  // 請求節流
  THROTTLE: {
    TOKENS_PER_BATCH: 10,   // 每批處理的代幣數量
    BATCH_DELAY: 500        // 批次間延遲(毫秒) 
  }
};

// CORS setup
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(bodyParser.json());

// 緩存
const caches = {
  token: new Map(),
  price: new Map(),
  balance: new Map()
};

// 封裝的API請求函數(帶重試機制)
async function apiRequest(url, config, tag = 'API') {
  let retries = 0;
  
  while (true) {
    try {
      return await axios.get(url, config);
    } catch (error) {
      retries++;
      
      // 如果不是429錯誤或已達最大重試次數，拋出錯誤
      if (error.response?.status !== 429 || retries >= CONFIG.RETRY.MAX_RETRIES) {
        throw error;
      }
      
      // 計算退避時間 (指數退避策略)
      const backoffTime = Math.min(
        CONFIG.RETRY.INITIAL_BACKOFF * Math.pow(2, retries - 1),
        CONFIG.RETRY.MAX_BACKOFF
      );
      
      console.warn(`${tag} 請求限制，等待 ${backoffTime}ms 後重試 (${retries}/${CONFIG.RETRY.MAX_RETRIES})`);
      
      // 等待退避時間後再重試
      await new Promise(resolve => setTimeout(resolve, backoffTime));
    }
  }
}

// 批量處理函數 (將大量請求分批處理)
async function processBatch(items, processFn, batchSize = CONFIG.THROTTLE.TOKENS_PER_BATCH, delayMs = CONFIG.THROTTLE.BATCH_DELAY) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    // 處理當前批次
    const batchResults = await Promise.all(batch.map(processFn));
    results.push(...batchResults);
    
    // 如果還有下一批，則等待指定時間
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 獲取代幣詳情函數
async function getTokenDetails(chainId, contractAddress) {
  if (!contractAddress) return null;
  
  // 跳過原生代幣地址(因為有BUG)
  if (contractAddress.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      logoURI: 'https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
    };
  }
  
  const cacheKey = `${chainId}-${contractAddress.toLowerCase()}`;
  
  // 檢查緩存
  if (caches.token.has(cacheKey) && caches.token.get(cacheKey).expiry > Date.now()) {
    return caches.token.get(cacheKey).data;
  }
  
  try {
    const url = `https://api.1inch.dev/token/v1.2/${chainId}/custom/${contractAddress}`;
    
    const config = {
      headers: {
        "Authorization": `Bearer ${INCH_API_KEY}`
      }
    };
    
    const response = await apiRequest(url, config, 'Token Details');
    const tokenData = response.data;
    
    // 儲存到緩存
    caches.token.set(cacheKey, {
      data: tokenData,
      expiry: Date.now() + CONFIG.CACHE_TTL.TOKEN_DETAILS
    });
    
    return tokenData;
  } catch (error) {
    console.error(`Error fetching token details for ${contractAddress}:`, error.message);
    return null;
  }
}

// 獲取代幣價格
async function getTokenPrice(chainId, tokenAddress) {
  if (!tokenAddress) return null;
  
  const cacheKey = `${chainId}-${tokenAddress.toLowerCase()}`;
  
  // 檢查緩存
  if (caches.price.has(cacheKey) && caches.price.get(cacheKey).expiry > Date.now()) {
    return caches.price.get(cacheKey).data;
  }
  
  try {
    const baseUrl = 'https://api.1inch.dev/token-details/v1.0/charts/interval';
    const url = `${baseUrl}/${chainId}/${tokenAddress}`;
    
    const config = {
      headers: {
        "Authorization": `Bearer ${INCH_API_KEY}`
      },
      params: {
        interval: '1d' // 使用1天間隔
      }
    };
    
    const response = await apiRequest(url, config);
    
    // 提取最新價格
    let latestPrice = null;
    if (response.data && response.data.d && response.data.d.length > 0) {
      const latestDataPoint = response.data.d[response.data.d.length - 1];
      latestPrice = latestDataPoint.c; // 使用收盤價
    }
    
    const priceData = { 
      price: latestPrice, 
      timestamp: Date.now() 
    };
    
    // 儲存到緩存
    caches.price.set(cacheKey, {
      data: priceData,
      expiry: Date.now() + CONFIG.CACHE_TTL.PRICE_DATA
    });
    
    return priceData;
  } catch (error) {
    console.error(`Error fetching token price for ${tokenAddress}:`, error.message);
    return { price: null, error: error.message };
  }
}

// 獲取錢包餘額
async function getWalletBalances(chainId, address) {
  const cacheKey = `${chainId}-${address.toLowerCase()}`;
  
  // 檢查緩存
  if (caches.balance.has(cacheKey) && caches.balance.get(cacheKey).expiry > Date.now()) {
    return caches.balance.get(cacheKey).data;
  }
  
  try {
    const url = `https://api.1inch.dev/balance/v1.2/${chainId}/balances/${address}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${INCH_API_KEY}`
      }
    };
    
    const response = await apiRequest(url, config, 'Wallet Balance');
    
    // 儲存到緩存
    caches.balance.set(cacheKey, {
      data: response.data,
      expiry: Date.now() + CONFIG.CACHE_TTL.BALANCE_DATA
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching wallet balances for ${address}:`, error.message);
    throw error;
  }
}

// 獲取多個代幣的詳情
async function getBatchTokenDetails(chainId, tokenAddresses) {
  if (tokenAddresses.length === 0) return {};
  
  try {
    // 嘗試批量獲取代幣詳情
    try {
      const url = `https://api.1inch.dev/token/v1.2/${chainId}/custom`;
      const config = {
        headers: {
          'Authorization': `Bearer ${INCH_API_KEY}`
        },
        params: {
          addresses: tokenAddresses
        }
      };
      
      const response = await apiRequest(url, config, 'Batch Token Details');
      return response.data;
    } catch (error) {
      console.warn('批量獲取代幣詳情失敗，切換到單個請求模式:', error.message);
      
      // 批量獲取失敗時，切換到單個請求模式
      const tokenDetailsMap = {};
      
      // 使用批次處理避免過多並發請求
      await processBatch(tokenAddresses, async (address) => {
        const details = await getTokenDetails(chainId, address);
        if (details) {
          tokenDetailsMap[address.toLowerCase()] = details;
        }
        return details;
      });
      
      return tokenDetailsMap;
    }
  } catch (error) {
    console.error('獲取代幣詳情時出錯:', error.message);
    return {};
  }
}

// 錢包代幣餘額 API 端點
app.get('/api/tokens/:chain/:address', async (req, res) => {
  try {
    const { chain, address } = req.params;
    
    if (!chain || !address) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Chain and wallet address are required'
      });
    }
    
    // 1. 獲取錢包餘額
    const balanceData = await getWalletBalances(chain, address);
    
    // 2. 過濾非零餘額的代幣
    const tokenAddresses = Object.entries(balanceData)
      .filter(([_, balance]) => balance !== '0')
      .map(([tokenAddress, _]) => tokenAddress);
    
    if (tokenAddresses.length === 0) {
      return res.status(200).json({ tokens: {} });
    }
    
    // 3. 批量獲取代幣詳情
    const tokenDetailsMap = await getBatchTokenDetails(chain, tokenAddresses);
    
    // 4. 組合數據
    const tokens = {};
    
    for (const [tokenAddress, balance] of Object.entries(balanceData)) {
      if (balance === '0') continue;
      
      const tokenDetails = tokenDetailsMap[tokenAddress.toLowerCase()] || null;
      
      if (tokenDetails) {
        const symbol = tokenDetails.symbol || 'UNKNOWN';
        const name = tokenDetails.name || 'Unknown Token';
        const decimals = tokenDetails.decimals || 18;
        
        // 獲取代幣價格
        const priceData = await getTokenPrice(chain, tokenAddress);
        const price = priceData?.price || 0;
        
        // 計算代幣價值
        const balanceInTokens = parseFloat(balance) / (10 ** decimals);
        const tokenValue = balanceInTokens * price;
        
        tokens[tokenAddress] = {
          address: tokenAddress,
          symbol: symbol,
          name: name,
          balance: balance,
          decimals: decimals,
          price: price,
          value: tokenValue,
          logoURI: tokenDetails.logoURI || '',
          details: tokenDetails
        };
      } else {
        tokens[tokenAddress] = {
          address: tokenAddress,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          balance: balance,
          decimals: 18,
          price: 0,
          value: 0,
          details: null
        };
      }
    }
    
    res.status(200).json({ tokens });
  } catch (error) {
    console.error('API proxy error:', error.message);
    console.error(error.stack);
    
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    
    res.status(status).json({
      error: 'Failed to fetch token information',
      message: message
    });
  }
});

// MultiBaas Webhook 接收器
app.post('/webhook', (req, res) => {
  console.log('Webhook 收到事件：', req.body);
  
  // 保留原有的日志输出
  console.log("📩 收到 MultiBaas Webhook 通知：", req.body);

  // TODO：这里你可以根据 req.body 里的事件内容去做后续处理
  // 例如储存纪录、计算利息、更新资料库等等

  res.status(200).send('Webhook received!');
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Allowing CORS requests from ${FRONTEND_URL}`);
}); 