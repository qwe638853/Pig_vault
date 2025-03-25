<template>
  <div>
    <!-- 頁面標題區 -->
    <v-sheet color="primary" class="py-6">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <div class="text-center mb-4">
              <h1 class="text-h3 text-md-h2 font-weight-bold text-white mb-2">
                Pig Vault
              </h1>
              <p class="text-subtitle-1 text-white text-opacity-75">
                Find and manage your small tokens
              </p>
            </div>
            
            <v-card class="search-card">
              <v-card-item>
                <div class="d-flex justify-center">
                  <v-btn
                    v-if="!isConnected"
                    color="primary"
                    size="large"
                    prepend-icon="mdi-wallet"
                    @click="handleConnectWalletEvent"
                  >
                    Connect Wallet
                  </v-btn>
                  <div v-else class="d-flex align-center flex-column flex-sm-row justify-space-between w-100">
                    <div class="text-center text-sm-start mb-4 mb-sm-0">
                      <div class="text-body-2 text-medium-emphasis">Wallet Address</div>
                      <div class="text-body-1 font-weight-medium">{{ formatAddress(address) }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <v-select
                        v-model="selectedChain"
                        :items="chains"
                        density="compact"
                        hide-details
                        variant="outlined"
                        class="mr-2"
                        style="min-width: 120px"
                      ></v-select>
                      <v-btn
                        color="primary"
                        :loading="isSearching"
                        @click="loadUserTokens"
                      >
                        Reload
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <!-- 代幣列表 -->
    <v-container class="py-8">
      <!-- 載入中狀態 -->
      <v-row v-if="isSearching" justify="center">
        <v-col cols="12" class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="text-subtitle-1 mt-4">Loading your tokens...</p>
        </v-col>
      </v-row>

      <!-- 有代幣結果時 -->
      <template v-else-if="tokens.length > 0">
        <v-row>
          <v-col cols="12" class="d-flex justify-space-between align-center mb-4">
            <div class="d-flex align-center">
              <v-icon color="primary" class="mr-2">mdi-coin</v-icon>
              <span class="text-h6">Found {{ tokens.length }} tokens</span>
            </div>
            <v-btn
              color="primary"
              :disabled="!hasSelectedTokens"
              @click="processSelectedTokens"
            >
              Process Selected ({{ selectedTokens.length }})
            </v-btn>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-data-table
              v-model="selectedTokens"
              :headers="tableHeaders"
              :items="tokens"
              :sort-by="[{ key: 'value', order: 'desc' }]"
              item-value="address"
              density="compact"
              hover
              show-select
              class="token-table"
            >
              <template v-slot:item.symbol="{ item }">
                <div class="d-flex align-center">
                  <v-avatar
                    :color="getTokenColor(item.symbol)"
                    size="24"
                    class="mr-2"
                  >
                    <span class="text-white text-caption">{{ item.symbol[0] }}</span>
                  </v-avatar>
                  <span>{{ item.symbol }}</span>
                </div>
              </template>
              
              <template v-slot:item.balance="{ item }">
                {{ formatBalance(item.balance, item.decimals) }}
              </template>
              
              <template v-slot:item.value="{ item }">
                ${{ formatValue(item.value) }}
              </template>
              
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getTokenStatusColor(item.status)"
                  size="x-small"
                  label
                >
                  {{ item.status }}
                </v-chip>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </template>

      <!-- 搜尋後無結果 -->
      <v-row v-else-if="hasSearched && isConnected" justify="center">
        <v-col cols="12" class="text-center">
          <v-icon color="grey" size="64" class="mb-4">mdi-pig-variant-off</v-icon>
          <p class="text-h6">No tokens found</p>
          <p class="text-body-2 text-medium-emphasis">Try selecting a different chain or check your wallet address.</p>
        </v-col>
      </v-row>

      <!-- 未連接錢包時顯示歡迎畫面 -->
      <welcome-screen v-else-if="!isConnected"></welcome-screen>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import WelcomeScreen from '../components/WelcomeScreen.vue'
import { API_BASE_URL, CHAINS, TOKEN_STATUS } from '../config'

const isConnected = inject('isConnected', ref(false))
const address = inject('address', ref(''))
const display = useDisplay()
const isMobile = display.mobile

// 搜尋相關
const isSearching = ref(false)
const hasSearched = ref(false)
const tokens = ref([])
const selectedTokens = ref([])

// 表格標頭
const tableHeaders = [
  { title: 'Token', key: 'symbol', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Balance', key: 'balance', sortable: true },
  { title: 'Value', key: 'value', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
]

// 鏈選項
const chains = CHAINS

const selectedChain = ref('ethereum')

// 計算屬性
const hasSelectedTokens = computed(() => selectedTokens.value.length > 0)

// 方法
const loadUserTokens = async () => {
  if (!isConnected.value || !address.value) {
    alert('Please connect your wallet first')
    return
  }
  
  isSearching.value = true
  hasSearched.value = true
  
  try {
    // 使用我們的 Express 服務器代理 1inch API
    const response = await fetch(`${API_BASE_URL}/tokens/${selectedChain.value}/${address.value}`)
    const data = await response.json()
    
    // 檢查是否有錯誤響應
    if (data.error) {
      throw new Error(data.message || 'Failed to fetch token data')
    }
    
    // 處理 API 返回的數據
    if (data && data.tokens) {
      tokens.value = Object.entries(data.tokens).map(([address, token]) => ({
        address,
        symbol: token.symbol,
        name: token.name,
        balance: token.balance,
        decimals: token.decimals,
        value: token.value || 0,
        status: getTokenStatus(token.value)
      }))
    } else {
      tokens.value = []
    }
  } catch (error) {
    console.error('Error fetching tokens:', error)
    alert(`Failed to load tokens: ${error.message}`)
    tokens.value = []
  } finally {
    isSearching.value = false
  }
}

const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const processSelectedTokens = () => {
  // 處理選中的代幣
  console.log('Processing tokens:', selectedTokens.value)
}

const formatBalance = (balance, decimals) => {
  return (balance / Math.pow(10, decimals)).toFixed(4)
}

const formatValue = (value) => {
  return value.toFixed(2)
}

const getTokenColor = (symbol) => {
  const colors = ['primary', 'success', 'info', 'warning', 'error']
  return colors[symbol.charCodeAt(0) % colors.length]
}

const getTokenStatus = (value) => {
  if (value >= TOKEN_STATUS.HIGH_VALUE) return 'High Value'
  if (value >= TOKEN_STATUS.MEDIUM_VALUE) return 'Medium Value'
  if (value > TOKEN_STATUS.LOW_VALUE) return 'Low Value'
  return 'No Value'
}

const getTokenStatusColor = (status) => {
  switch (status) {
    case 'High Value': return 'success'
    case 'Medium Value': return 'info'
    case 'Low Value': return 'warning'
    default: return 'error'
  }
}

// 生命週期鉤子
onMounted(() => {
  // 如果已連接錢包，則自動載入用戶的代幣
  if (isConnected.value && address.value) {
    loadUserTokens()
  }
  
  // 監聽自定義的連接錢包事件
  window.addEventListener('connect-wallet', handleConnectWalletEvent)
  
  return () => {
    // 在組件卸載時移除事件監聽器
    window.removeEventListener('connect-wallet', handleConnectWalletEvent)
  }
})

// 監聽 isConnected 和 selectedChain 的變化
watch([isConnected, selectedChain], ([newIsConnected, newChain], [oldIsConnected, oldChain]) => {
  // 當連接狀態變化或選擇的鏈變化時，如果已連接錢包，則重新載入代幣
  if ((newIsConnected !== oldIsConnected || newChain !== oldChain) && newIsConnected && address.value) {
    loadUserTokens()
  }
})

// 處理連接錢包事件
const handleConnectWalletEvent = async () => {
  try {
    // 觸發 App.vue 中定義的連接錢包方法
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (accounts.length > 0) {
        // App.vue 會設置 isConnected 和 address
        // 當錢包連接後，自動載入該錢包的代幣
        setTimeout(() => {
          if (isConnected.value && address.value) {
            loadUserTokens()
          }
        }, 500) // 給一些時間讓 isConnected 和 address 更新
      }
    } else {
      alert('Please install MetaMask first!')
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    alert('Failed to connect wallet: ' + error.message)
  }
}
</script>

<style scoped>
.search-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.token-table {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

@media (max-width: 600px) {
  .text-h3 {
    font-size: 1.75rem !important;
  }
}
</style>