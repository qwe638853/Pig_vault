<template>
  <div>
    <!-- 頁面標題區 -->
    <v-sheet color="transparent" class="py-6 neon-header">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <div class="text-center mb-4">
              <h1 class="text-h3 text-md-h2 font-weight-bold glow-text mb-2">
                Pig Vault
              </h1>
              <p class="text-subtitle-1 text-opacity-75 subtitle-text">
                尋找並管理您的小額代幣資產
              </p>
            </div>
            
            <v-card class="search-card glass-card">
              <v-card-item>
                <div class="d-flex justify-center">
                  <v-btn
                    v-if="!isConnected"
                    color="primary"
                    size="large"
                    class="glow-effect"
                    prepend-icon="mdi-wallet"
                    @click="handleConnectWalletEvent"
                  >
                    連接錢包
                  </v-btn>
                  <div v-else class="d-flex align-center flex-column flex-sm-row justify-space-between w-100">
                    <div class="text-center text-sm-start mb-4 mb-sm-0">
                      <div class="text-body-2 text-medium-emphasis">錢包地址</div>
                      <div class="text-body-1 font-weight-medium glow-text-subtle">{{ formatAddress(address) }}</div>
                    </div>
                    <div class="d-flex gap-2">
                      <v-select
                        v-model="selectedChain"
                        :items="chains"
                        item-title="title"
                        item-value="value"
                        density="compact"
                        hide-details
                        variant="outlined"
                        class="mr-2 chain-select"
                        style="min-width: 120px"
                      ></v-select>
                      <v-btn
                        color="primary"
                        :loading="isSearching"
                        class="glow-effect"
                        @click="loadUserTokens"
                      >
                        重新整理
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
          <p class="text-subtitle-1 mt-4 glow-text-subtle">正在載入您的代幣資產...</p>
        </v-col>
      </v-row>

      <!-- 有代幣結果時 -->
      <template v-else-if="tokens.length > 0">
        <v-row>
          <v-col cols="12" class="d-flex flex-column flex-sm-row justify-space-between align-center mb-4">
            <div class="d-flex align-center mb-4 mb-sm-0">
              <v-icon color="primary" class="mr-2 glow-icon">mdi-coin</v-icon>
              <span class="text-h6 glow-text-subtle">找到 {{ tokens.length }} 個代幣</span>
            </div>
            <v-btn
              color="primary"
              class="glow-effect"
              :disabled="!hasSelectedTokens"
              @click="processSelectedTokens"
            >
              處理已選取的代幣 ({{ selectedTokens.length }})
            </v-btn>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="token-table-card glass-card">
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
                      :image="item.logoURI || undefined"
                      :color="item.logoURI ? undefined : getTokenColor(item.symbol)"
                      size="28"
                      class="mr-2 token-avatar"
                    >
                      <span v-if="!item.logoURI" class="text-white text-caption">{{ item.symbol[0] }}</span>
                    </v-avatar>
                    <span class="token-symbol">{{ item.symbol }}</span>
                  </div>
                </template>
                
                <template v-slot:item.balance="{ item }">
                  <div class="token-balance">{{ formatBalance(item.balance, item.decimals) }}</div>
                </template>
                
                <template v-slot:item.value="{ item }">
                  <div class="token-value">${{ formatValue(item.value) }}</div>
                </template>
                
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getTokenStatusColor(item.status)"
                    size="small"
                    label
                    class="status-chip"
                  >
                    {{ getLocalizedStatus(item.status) }}
                  </v-chip>
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon
                    v-if="item.details"
                    color="primary"
                    size="small"
                    variant="text"
                    class="details-btn"
                    @click="showTokenDetails(item)"
                  >
                    <v-icon>mdi-information-outline</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </template>

      <!-- 搜尋後無結果 -->
      <v-row v-else-if="hasSearched && isConnected" justify="center">
        <v-col cols="12" md="8" class="text-center">
          <v-card class="empty-state-card glass-card py-8">
            <v-icon color="grey" size="64" class="mb-4">mdi-pig-variant-off</v-icon>
            <p class="text-h6 glow-text-subtle">沒有找到代幣</p>
            <p class="text-body-2 text-medium-emphasis">嘗試選擇不同的區塊鏈或檢查您的錢包地址是否正確。</p>
            <v-btn 
              color="primary" 
              class="mt-4 glow-effect"
              @click="loadUserTokens"
            >
              重新整理
            </v-btn>
          </v-card>
        </v-col>
      </v-row>

      <!-- 未連接錢包時顯示歡迎畫面 -->
      <welcome-screen v-else-if="!isConnected"></welcome-screen>
    </v-container>

    <!-- 代幣詳細信息對話框 -->
    <v-dialog v-model="isDetailsDialogOpen" width="800" class="token-details-dialog">
      <v-card v-if="selectedTokenDetails" class="details-card glass-card">
        <v-card-item>
          <div class="d-flex align-center">
            <v-avatar
              :image="selectedTokenDetails.logoURI || undefined"
              :color="selectedTokenDetails.logoURI ? undefined : getTokenColor(selectedTokenDetails.symbol)"
              size="48"
              class="mr-4 token-detail-avatar"
            >
              <span v-if="!selectedTokenDetails.logoURI" class="text-white">{{ selectedTokenDetails.symbol[0] }}</span>
            </v-avatar>
            <div>
              <v-card-title class="px-0 py-1 glow-text">
                {{ selectedTokenDetails.name }} ({{ selectedTokenDetails.symbol }})
              </v-card-title>
              <v-card-subtitle class="px-0 py-1 text-caption d-flex align-center">
                <span class="address-text">{{ selectedTokenDetails.address }}</span>
                <v-btn 
                  icon 
                  density="compact" 
                  variant="text" 
                  size="small" 
                  class="ml-2"
                  title="複製地址"
                  @click="copyToClipboard(selectedTokenDetails.address)"
                >
                  <v-icon size="small">mdi-content-copy</v-icon>
                </v-btn>
              </v-card-subtitle>
            </div>
          </div>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text v-if="selectedTokenDetails.details">
          <div v-if="selectedTokenDetails.details.assets">
            <h3 class="text-h6 mb-3 glow-text-subtle">代幣資訊</h3>
            
            <v-row>
              <v-col cols="12" md="6">
                <div class="mb-4" v-if="selectedTokenDetails.details.assets.description">
                  <div class="text-subtitle-2 font-weight-bold mb-1">描述</div>
                  <div class="text-body-2">{{ selectedTokenDetails.details.assets.description }}</div>
                </div>

                <div class="mb-4" v-if="selectedTokenDetails.details.assets.website">
                  <div class="text-subtitle-2 font-weight-bold mb-1">網站</div>
                  <a 
                    :href="selectedTokenDetails.details.assets.website" 
                    target="_blank" 
                    class="text-decoration-none website-link"
                  >
                    {{ selectedTokenDetails.details.assets.website }}
                  </a>
                </div>

                <div v-if="selectedTokenDetails.details.assets.social_links && selectedTokenDetails.details.assets.social_links.length > 0">
                  <div class="text-subtitle-2 font-weight-bold mb-1">社群媒體</div>
                  <div class="d-flex flex-wrap gap-2 mb-4">
                    <v-btn
                      v-for="link in selectedTokenDetails.details.assets.social_links"
                      :key="link.name"
                      :href="link.url"
                      target="_blank"
                      size="small"
                      variant="outlined"
                      :prepend-icon="getSocialIcon(link.name)"
                      color="primary"
                      class="social-btn"
                    >
                      {{ link.name }}
                    </v-btn>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="6">
                <div v-if="selectedTokenDetails.details.details">
                  <v-card class="details-metrics-card glass-card mb-4">
                    <v-list density="compact" class="bg-transparent">
                      <v-list-item v-if="selectedTokenDetails.details.details.marketCap">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-chart-line" class="mr-2 glow-icon"></v-icon>
                        </template>
                        <v-list-item-title>市值</v-list-item-title>
                        <v-list-item-subtitle>${{ formatLargeNumber(selectedTokenDetails.details.details.marketCap) }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="selectedTokenDetails.details.details.vol24">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-swap-horizontal" class="mr-2 glow-icon"></v-icon>
                        </template>
                        <v-list-item-title>24小時交易量</v-list-item-title>
                        <v-list-item-subtitle>${{ formatLargeNumber(selectedTokenDetails.details.details.vol24) }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="selectedTokenDetails.details.details.circulatingSupply">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-circle-multiple" class="mr-2 glow-icon"></v-icon>
                        </template>
                        <v-list-item-title>流通供應量</v-list-item-title>
                        <v-list-item-subtitle>{{ formatLargeNumber(selectedTokenDetails.details.details.circulatingSupply) }} {{ selectedTokenDetails.symbol }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item v-if="selectedTokenDetails.details.details.totalSupply">
                        <template v-slot:prepend>
                          <v-icon icon="mdi-circle-multiple-outline" class="mr-2 glow-icon"></v-icon>
                        </template>
                        <v-list-item-title>總供應量</v-list-item-title>
                        <v-list-item-subtitle>{{ formatLargeNumber(selectedTokenDetails.details.details.totalSupply) }} {{ selectedTokenDetails.symbol }}</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </div>
                
                <div v-if="selectedTokenDetails.details.assets.explorer">
                  <v-btn
                    :href="selectedTokenDetails.details.assets.explorer"
                    target="_blank"
                    block
                    variant="outlined"
                    color="primary"
                    class="mt-4 glow-effect"
                    prepend-icon="mdi-open-in-new"
                  >
                    在區塊鏈瀏覽器中查看
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </div>
          <div v-else class="text-center py-4">
            <p class="text-body-1">此代幣沒有可用的詳細資訊。</p>
          </div>
        </v-card-text>
        
        <v-card-text v-else class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-2">正在載入代幣詳細資訊...</p>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            class="glow-hover"
            @click="isDetailsDialogOpen = false"
          >
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 複製成功提示 -->
    <v-snackbar
      v-model="showCopySnackbar"
      timeout="2000"
      color="success"
      location="top"
    >
      已複製到剪貼簿
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useDisplay } from 'vuetify'
import WelcomeScreen from '../components/WelcomeScreen.vue'
import { API_BASE_URL, CHAINS, TOKEN_STATUS } from '../config'

const isConnected = inject('isConnected', ref(false))
const address = inject('address', ref(''))
const isDark = inject('isDark', ref(false))
const display = useDisplay()
const isMobile = display.mobile

// 搜尋相關
const isSearching = ref(false)
const hasSearched = ref(false)
const tokens = ref([])
const selectedTokens = ref([])
const showCopySnackbar = ref(false)

// 表格標頭
const tableHeaders = [
  { title: '代幣', key: 'symbol', sortable: true },
  { title: '名稱', key: 'name', sortable: true },
  { title: '餘額', key: 'balance', sortable: true },
  { title: '價值', key: 'value', sortable: true },
  { title: '狀態', key: 'status', sortable: true },
  { title: '操作', key: 'actions', sortable: false }
]

// 鏈選項
const chains = CHAINS

const selectedChain = ref('1')

// 計算屬性
const hasSelectedTokens = computed(() => selectedTokens.value.length > 0)

// 詳細信息相關
const isDetailsDialogOpen = ref(false)
const selectedTokenDetails = ref(null)

// 方法
const loadUserTokens = async () => {
  if (!isConnected.value || !address.value) {
    alert('請先連接您的錢包')
    return
  }
  
  isSearching.value = true
  hasSearched.value = true
  
  try {
    // Call our Express server which proxies the 1inch API
    console.log(`正在載入區塊鏈 ID: ${selectedChain.value} 的代幣`)
    const response = await fetch(`${API_BASE_URL}/tokens/${selectedChain.value}/${address.value}`)
    const data = await response.json()
    
    // Check for error response
    if (data.error) {
      throw new Error(data.message || '無法獲取代幣資料')
    }
    
    // Process API response data
    if (data && data.tokens) {
      // Convert tokens object to array and calculate values
      tokens.value = Object.values(data.tokens)
        .map(token => {
          // Extract decimals from details if available
          const decimals = token.details?.assets?.decimals || 18
          
          // Calculate balance in tokens
          const balanceInTokens = parseFloat(token.balance) / (10 ** decimals)
          
          // Extract price if available
          const price = token.details?.details?.price || 0
          
          // Calculate value
          const valueInUSD = balanceInTokens * price
          
          return {
            ...token,
            decimals: decimals,
            value: valueInUSD,
            logoURI: token.details?.assets?.logoURI || '',
            status: getTokenStatus(valueInUSD)
          }
        })
    } else {
      tokens.value = []
    }
  } catch (error) {
    console.error('獲取代幣時出錯:', error)
    alert(`載入代幣失敗: ${error.message}`)
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
  console.log('處理代幣:', selectedTokens.value)
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

const getLocalizedStatus = (status) => {
  switch (status) {
    case 'High Value': return '高價值'
    case 'Medium Value': return '中等價值'
    case 'Low Value': return '低價值'
    default: return '無價值'
  }
}

const getTokenStatusColor = (status) => {
  switch (status) {
    case 'High Value': return 'success'
    case 'Medium Value': return 'info'
    case 'Low Value': return 'warning'
    default: return 'error'
  }
}

// 複製到剪貼簿
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    showCopySnackbar.value = true
  }).catch(err => {
    console.error('複製失敗:', err)
  })
}

// 生命週期鉤子
onMounted(() => {
  console.log('首頁已載入，選擇的區塊鏈:', selectedChain.value)
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
      alert('請先安裝 MetaMask 錢包!')
    }
  } catch (error) {
    console.error('連接錢包失敗:', error)
    alert('連接錢包失敗: ' + error.message)
  }
}

// 顯示代幣詳細信息
const showTokenDetails = (token) => {
  selectedTokenDetails.value = token
  isDetailsDialogOpen.value = true
}

// 獲取社交媒體圖標
const getSocialIcon = (socialName) => {
  const name = socialName.toLowerCase()
  if (name.includes('twitter') || name.includes('x.com')) return 'mdi-twitter'
  if (name.includes('telegram')) return 'mdi-telegram'
  if (name.includes('discord')) return 'mdi-discord'
  if (name.includes('medium')) return 'mdi-medium'
  if (name.includes('github')) return 'mdi-github'
  if (name.includes('reddit')) return 'mdi-reddit'
  if (name.includes('youtube')) return 'mdi-youtube'
  if (name.includes('facebook')) return 'mdi-facebook'
  if (name.includes('instagram')) return 'mdi-instagram'
  if (name.includes('linkedin')) return 'mdi-linkedin'
  return 'mdi-web'
}

// 格式化大數字
const formatLargeNumber = (num) => {
  if (num === undefined || num === null) return 'N/A'
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B'
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  } else {
    return num.toFixed(2)
  }
}
</script>

<style scoped>
/* 霓虹風格頭部 */
.neon-header {
  background: linear-gradient(180deg, var(--bg-secondary), transparent);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  position: relative;
}

.search-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

.search-card:hover {
  border-color: var(--neon-primary);
  box-shadow: 0 0 var(--glow-strength) var(--neon-primary);
}

/* 表格樣式 */
.token-table-card {
  overflow: hidden;
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.token-table {
  background: transparent !important;
}

.token-avatar {
  border: 1px solid var(--neon-secondary);
  box-shadow: 0 0 8px var(--neon-primary);
}

.token-symbol {
  font-weight: 600;
  letter-spacing: 0.5px;
}

.token-balance {
  font-family: 'Space Grotesk', monospace;
  letter-spacing: 0.5px;
}

.token-value {
  font-weight: 600;
  color: var(--neon-primary);
}

.status-chip {
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 0 8px rgba(0, 255, 224, 0.2);
}

.details-btn {
  transition: all 0.3s ease;
}

.details-btn:hover {
  transform: scale(1.2);
  color: var(--neon-primary) !important;
  filter: drop-shadow(0 0 5px var(--neon-primary));
}

/* 空狀態卡片 */
.empty-state-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
}

/* 詳情對話框 */
.details-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(15px);
  border: 1px solid var(--neon-primary);
  overflow: hidden;
}

.token-detail-avatar {
  border: 2px solid var(--neon-secondary);
  box-shadow: 0 0 15px var(--neon-primary);
}

.address-text {
  opacity: 0.7;
  font-family: 'Space Grotesk', monospace;
}

.details-metrics-card {
  background: rgba(0, 255, 224, 0.05) !important;
  border: 1px solid var(--glass-border);
}

.social-btn {
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.website-link {
  color: var(--neon-primary);
  transition: all 0.3s ease;
}

.website-link:hover {
  text-shadow: 0 0 5px var(--neon-primary);
  text-decoration: underline !important;
}

/* 發光文字效果 */
.glow-text {
  color: var(--text-primary);
  text-shadow: 0 0 10px var(--neon-primary);
}

.glow-text-subtle {
  color: var(--text-primary);
  text-shadow: 0 0 5px rgba(0, 255, 224, 0.5);
}

.glow-icon {
  filter: drop-shadow(0 0 5px var(--neon-primary));
}

.subtitle-text {
  color: var(--text-secondary);
}

/* 鏈選擇器樣式 */
.chain-select {
  border-radius: 8px;
  overflow: hidden;
}

/* 深色模式特殊樣式 */
:deep(.v-theme--dark) .token-table {
  color: var(--text-primary) !important;
}

:deep(.v-theme--dark) .v-data-table__td {
  color: var(--text-primary) !important;
}

:deep(.v-theme--dark) .v-data-table__th {
  color: var(--neon-primary) !important;
  background: rgba(0, 0, 0, 0.2) !important;
}

/* 淺色模式特殊樣式 */
:deep(.v-theme--light) .token-table {
  color: var(--text-primary) !important;
}

:deep(.v-theme--light) .v-data-table__th {
  color: var(--neon-primary) !important;
  background: rgba(255, 255, 255, 0.2) !important;
}

@media (max-width: 600px) {
  .text-h3 {
    font-size: 1.75rem !important;
  }
  
  .token-avatar {
    margin-right: 0.5rem !important;
  }
  
  .details-card {
    margin: 0 8px;
  }
}
</style>