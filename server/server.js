const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const INCH_API_KEY = process.env.INCH_API_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// CORS setup
app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Cache for token details
const tokenCache = new Map();

// Function to get token details
async function getTokenDetails(chainId, contractAddress) {
  if (!contractAddress) return null;
  
  // 跳過原生代幣地址
  if (contractAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return {
      assets: {
        symbol: 'ETH',
        name: 'Ethereum'
      }
    };
  }
  
  const cacheKey = `details-${chainId}-${contractAddress.toLowerCase()}`;
  
  // Check cache first
  if (tokenCache.has(cacheKey) && tokenCache.get(cacheKey).expiry > Date.now()) {
    return tokenCache.get(cacheKey).data;
  }
  
  try {
    const baseUrl = 'https://api.1inch.dev/token-details/v1.0/details';
    const url = `${baseUrl}/${chainId}/${contractAddress}`;
    console.log(url);
    
    const config = {
      headers: {
        "Authorization": `Bearer ${INCH_API_KEY}`
      },
      params: {},
      paramsSerializer: {
        indexes: null
      }
    };
    
    const response = await axios.get(url, config);
    
    // Store in cache with 1-hour expiry
    tokenCache.set(cacheKey, {
      data: response.data,
      expiry: Date.now() + 60 * 60 * 1000 // 1 hour
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching token details for ${contractAddress}:`, error.message);
    return null;
  }
}

// Proxy endpoint for wallet token balances with details
app.get('/api/tokens/:chain/:address', async (req, res) => {
  try {
    const { chain, address } = req.params;
    
    // Validate parameters
    if (!chain || !address) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Chain and wallet address are required'
      });
    }
    
    // Fetch wallet balances from 1inch API
    const balanceResponse = await axios.get(
      `https://api.1inch.dev/balance/v1.2/${chain}/balances/${address}`, {
        headers: {
          'Authorization': `Bearer ${INCH_API_KEY}`
        }
      }
    );
    
    // Process the balance data
    const tokens = {};
    const detailsPromises = [];
    
    // First pass: Create basic token objects
    for (const [tokenAddress, balance] of Object.entries(balanceResponse.data)) {
      // Skip tokens with zero balance
      if (balance === '0') continue;
      
      // Add promise to fetch token details
      detailsPromises.push(
        getTokenDetails(chain, tokenAddress)
          .then(details => {
            if (details) {
              // Extract basic token info from details if available
              const symbol = details.assets?.symbol || 'UNKNOWN';
              const name = details.assets?.name || 'Unknown Token';
              
              tokens[tokenAddress] = {
                address: tokenAddress,
                symbol: symbol,
                name: name,
                balance: balance,
                details: details
              };
            } else {
              // If no details available, create a minimal token entry
              tokens[tokenAddress] = {
                address: tokenAddress,
                symbol: 'UNKNOWN',
                name: 'Unknown Token',
                balance: balance,
                details: null
              };
            }
            return details;
          })
          .catch(err => {
            console.error(`Error getting details for ${tokenAddress}:`, err.message);
            // Create a minimal token entry in case of error
            tokens[tokenAddress] = {
              address: tokenAddress,
              symbol: 'UNKNOWN',
              name: 'Unknown Token',
              balance: balance,
              details: null
            };
            return null;
          })
      );
    }
    
    // Wait for all detail requests to complete (but limit to 10 seconds max)
    if (detailsPromises.length > 0) {
      try {
        await Promise.race([
          Promise.all(detailsPromises),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
        ]);
      } catch (error) {
        console.warn('Not all token details could be fetched in time:', error.message);
      }
    }
    
    // Return formatted response
    res.status(200).json({ tokens });
  } catch (error) {
    console.error('API proxy error:', error.message);
    
    // Handle API errors
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    
    res.status(status).json({
      error: 'Failed to fetch token information',
      message: message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Allowing CORS requests from ${FRONTEND_URL}`);
}); 