<template>
  <v-container>
    <!-- Page Title -->
    <h1 class="text-h4 mb-2">Asset Management</h1>
    <p class="text-subtitle-2 text-medium-emphasis mb-6">
      Manage your wallet assets and convert idle tokens into yield
    </p>
    
    <!-- Wallet Connection Prompt -->
    <v-card v-if="!isConnected" class="text-center pa-4 mb-6">
      <v-icon size="48" color="primary" class="mb-2">mdi-wallet-outline</v-icon>
      <h2 class="text-h5 mb-2">Please Connect Your Wallet</h2>
      <p class="mb-3 text-body-2">Connect your wallet to manage assets and earn yield</p>
      <v-btn 
        color="primary" 
        @click="connectWallet"
        :loading="loading.wallet"
      >
        Connect Wallet
      </v-btn>
    </v-card>
            
    <!-- Connected Wallet Assets -->
    <template v-else>
      <!-- Asset Overview -->
      <v-row class="mb-6">
        <v-col v-for="(card, index) in [
          { title: 'Total Assets', value: '$4,200.58', change: '+3.2%', icon: 'mdi-cash-multiple', color: 'primary' },
          { title: 'Deposited Amount', value: '$1,250.00', change: '+5.4%', icon: 'mdi-bank', color: 'success' },
          { title: 'Current Yield', value: '12.5%', change: '+2.1%', icon: 'mdi-chart-line', color: 'info' }
        ]" :key="index" cols="12" sm="6" md="4">
          <v-card elevation="1" class="mb-4">
            <v-card-item>
              <v-avatar
                :color="card.color"
                size="42"
                class="mb-3"
              >
                <v-icon color="white">{{ card.icon }}</v-icon>
              </v-avatar>
              <v-card-title>{{ card.title }}</v-card-title>
              <div class="d-flex align-center mt-2">
                <div class="text-h5">{{ card.value }}</div>
                <v-chip color="success" size="small" class="ml-2">
                  <v-icon size="small">mdi-arrow-up</v-icon>
                  {{ card.change }}
                </v-chip>
              </div>
            </v-card-item>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Wallet Balance -->
      <v-card class="mb-6">
        <v-card-title class="bg-grey-lighten-3">
          <span>Wallet Balance</span>
          <v-spacer></v-spacer>
          <v-btn v-if="!isMobile" color="primary" variant="text" prepend-icon="mdi-refresh" @click="fetchWalletTokens" :loading="loading.walletTokens">
            Refresh
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <template v-if="walletTokens.length">
              <v-col 
                v-for="token in walletTokens" 
                :key="token.address" 
                cols="12" 
                md="6"
                lg="4"
              >
                <v-card variant="outlined" class="mb-4">
                  <v-card-item>
                    <div class="d-flex justify-space-between align-center mb-4">
                      <div class="d-flex align-center">
                        <v-avatar
                          color="primary"
                          size="36"
                          class="mr-3"
                        >
                          <span class="text-white font-weight-bold">{{ token.symbol.charAt(0) }}</span>
                        </v-avatar>
                        <div>
                          <div class="text-subtitle-1 font-weight-bold">{{ token.symbol }}</div>
                          <div class="text-caption text-medium-emphasis">{{ formatAddress(token.address) }}</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-h6">{{ token.balance }}</div>
                        <div class="text-caption text-medium-emphasis">≈ ${{ (token.symbol === 'ETH' ? token.balance * 3000 : token.balance).toFixed(2) }}</div>
                      </div>
                    </div>
                    <v-btn 
                      @click="depositToken(token)" 
                      color="primary" 
                      block
                      prepend-icon="mdi-plus"
                    >
                      Deposit
                    </v-btn>
                  </v-card-item>
                </v-card>
              </v-col>
            </template>
            <v-col v-else-if="loading.walletTokens" cols="12" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary" class="mb-3"></v-progress-circular>
              <div>Loading wallet assets...</div>
            </v-col>
            <v-col v-else cols="12" class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-wallet-outline</v-icon>
              <div class="mt-4">No tokens found</div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions v-if="isMobile" class="justify-center">
          <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" @click="fetchWalletTokens" :loading="loading.walletTokens">
            Refresh
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Deposited Assets -->
      <v-card>
        <v-card-title class="bg-grey-lighten-3">
          <span>Deposited Assets</span>
          <v-spacer></v-spacer>
          <v-btn v-if="!isMobile" color="primary" variant="text" prepend-icon="mdi-refresh" @click="fetchDepositedTokens" :loading="loading.depositedTokens">
            Refresh
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <template v-if="depositedTokens.length">
              <v-col 
                v-for="token in depositedTokens" 
                :key="token.address" 
                cols="12" 
                md="6"
                lg="4"
              >
                <v-card variant="outlined" class="mb-4">
                  <v-card-item>
                    <div class="d-flex justify-space-between align-center mb-4">
                      <div class="d-flex align-center">
                        <v-avatar
                          color="success"
                          size="36"
                          class="mr-3"
                        >
                          <span class="text-white font-weight-bold">{{ token.symbol.charAt(0) }}</span>
                        </v-avatar>
                        <div>
                          <div class="text-subtitle-1 font-weight-bold">{{ token.symbol }}</div>
                          <div class="text-caption text-success">Deposited</div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-h6">{{ token.balance }}</div>
                        <div class="text-caption text-medium-emphasis">≈ ${{ (token.symbol === 'ETH' ? token.balance * 3000 : token.balance).toFixed(2) }}</div>
                      </div>
                    </div>
                    <div class="d-flex justify-space-between align-center">
                      <div class="d-flex align-center text-success">
                        <v-icon size="small" class="mr-1">mdi-chart-line</v-icon>
                        <span class="text-body-2">APY: 12.5%</span>
                      </div>
                      <v-btn 
                        @click="withdrawToken(token)" 
                        color="error" 
                        prepend-icon="mdi-minus"
                        size="small"
                      >
                        Withdraw
                      </v-btn>
                    </div>
                  </v-card-item>
                </v-card>
              </v-col>
            </template>
            <v-col v-else-if="loading.depositedTokens" cols="12" class="text-center pa-8">
              <v-progress-circular indeterminate color="success" class="mb-3"></v-progress-circular>
              <div>Loading deposited assets...</div>
            </v-col>
            <v-col v-else cols="12" class="text-center pa-8">
              <v-icon size="64" color="grey-lighten-1">mdi-bank-outline</v-icon>
              <div class="mt-4">You haven't deposited any assets yet</div>
              <v-btn color="primary" class="mt-4">Deposit Assets</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions v-if="isMobile" class="justify-center">
          <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" @click="fetchDepositedTokens" :loading="loading.depositedTokens">
            Refresh
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useDisplay } from 'vuetify'

const isConnected = inject('isConnected', ref(false))
const address = inject('address', ref(''))
const display = useDisplay()
const isMobile = display.mobile
const walletTokens = ref([])
const depositedTokens = ref([])
const loading = ref({
  wallet: false,
  walletTokens: false,
  depositedTokens: false
})

const connectWallet = async () => {
  try {
    loading.value.wallet = true
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      address.value = accounts[0]
      isConnected.value = true
      await fetchWalletTokens()
      await fetchDepositedTokens()
    } else {
      alert('Please install MetaMask wallet')
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    alert('Failed to connect wallet')
  } finally {
    loading.value.wallet = false
  }
}

const formatAddress = (address) => {
  if (!address || address === '0x...') return '0x...'
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

const depositToken = async (token) => {
  try {
    // Implement token deposit logic here
    console.log('Depositing token:', token)
  } catch (error) {
    console.error('Failed to deposit token:', error)
  }
}

const withdrawToken = async (token) => {
  try {
    // Implement token withdrawal logic here
    console.log('Withdrawing token:', token)
  } catch (error) {
    console.error('Failed to withdraw token:', error)
  }
}

const fetchWalletTokens = async () => {
  try {
    loading.value.walletTokens = true
    // Implement logic to fetch wallet token balances
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    walletTokens.value = [
      { symbol: 'ETH', address: '0x...', balance: 1.5 },
      { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', balance: 1000 },
      { symbol: 'USDC', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', balance: 500 }
    ]
  } catch (error) {
    console.error('Failed to fetch token balances:', error)
  } finally {
    loading.value.walletTokens = false
  }
}

const fetchDepositedTokens = async () => {
  try {
    loading.value.depositedTokens = true
    // Implement logic to fetch deposited tokens
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    depositedTokens.value = [
      { symbol: 'ETH', address: '0x...', balance: 0.5 },
      { symbol: 'USDT', address: '0xdac17f958d2ee523a2206206994597c13d831ec7', balance: 500 }
    ]
  } catch (error) {
    console.error('Failed to fetch deposited tokens:', error)
  } finally {
    loading.value.depositedTokens = false
  }
}

onMounted(async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts.length > 0) {
      address.value = accounts[0]
      isConnected.value = true
      await fetchWalletTokens()
      await fetchDepositedTokens()
    }
  }
})
</script>

<style scoped>
@media (max-width: 600px) {
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .v-card-title {
    font-size: 1.25rem !important;
  }
}
</style> 