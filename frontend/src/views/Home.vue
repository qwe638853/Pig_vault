<template>
  <div>
    <!-- Main Title Section -->
    <v-sheet color="primary" class="py-6">
      <v-container class="text-center">
        <v-row justify="center">
          <v-col cols="12" md="8" lg="6">
            <h1 class="text-h3 text-md-h2 font-weight-bold text-white mb-3">
              Pig Vault
            </h1>
            <p class="text-subtitle-1 text-white text-opacity-75 mb-4">
              Help you clean up small amounts of tokens in your wallet and convert them into valuable assets or yields
            </p>
            <v-btn
              v-if="!isConnected"
              @click="connectWalletFromHome"
              color="white"
              class="text-primary"
              prepend-icon="mdi-wallet"
            >
              Connect Wallet
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <!-- Services Section -->
    <v-container class="py-8">
      <v-row justify="center">
        <v-col cols="12" md="10">
          <h2 class="text-h4 font-weight-bold mb-6 text-center">Our Services</h2>
          
          <v-row>
            <v-col v-for="(service, i) in services" :key="i" cols="12" sm="6" md="4">
              <v-card
                class="h-100"
                elevation="1"
              >
                <v-card-item>
                  <div class="d-flex align-center mb-3">
                    <v-avatar
                      :color="service.color"
                      class="white--text mr-3"
                      size="36"
                    >
                      <v-icon size="18" color="white">{{ service.icon }}</v-icon>
                    </v-avatar>
                    <v-card-title class="pa-0">{{ service.title }}</v-card-title>
                  </div>
                  <v-card-text class="px-0 text-body-1">{{ service.text }}</v-card-text>
                </v-card-item>

                <v-card-actions class="px-4 pb-4">
                  <v-btn
                    :color="service.color"
                    variant="text"
                    :to="service.route"
                    :prepend-icon="service.icon"
                  >
                    {{ service.btnText }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <!-- Features Section -->
    <v-sheet color="grey-lighten-4" class="py-8">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="10">
            <h2 class="text-h4 font-weight-bold mb-6 text-center">Smarter Asset Management</h2>

            <v-row>
              <v-col v-for="(feature, i) in features" :key="i" cols="12" sm="6" lg="3">
                <v-card variant="flat" class="bg-transparent h-100">
                  <v-card-item>
                    <div class="d-flex align-center mb-3">
                      <v-avatar
                        color="primary"
                        size="32"
                        class="mr-3"
                      >
                        <v-icon color="white" size="16">{{ feature.icon }}</v-icon>
                      </v-avatar>
                      <v-card-title class="pa-0 text-subtitle-1 font-weight-bold">{{ feature.title }}</v-card-title>
                    </div>
                    <v-card-text class="px-0 text-body-2">{{ feature.text }}</v-card-text>
                  </v-card-item>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useDisplay } from 'vuetify'

const isConnected = inject('isConnected', ref(false))
const display = useDisplay()
const isMobile = display.mobile

const connectWalletFromHome = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      isConnected.value = true
    } else {
      alert('Please install MetaMask wallet')
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    alert('Failed to connect wallet')
  }
}

onMounted(() => {
  // Check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
      if (accounts.length > 0) {
        isConnected.value = true
      }
    })
  }
})

const features = [
  { title: 'Optimize Small Tokens', icon: 'mdi-cash-multiple', text: 'Centrally manage small amounts of tokens in your wallet, reducing idle assets' },
  { title: 'Safe & Reliable', icon: 'mdi-shield-check', text: 'Built on blockchain technology to ensure asset security and transaction transparency' },
  { title: 'Increase Returns', icon: 'mdi-chart-line', text: 'Maximize your asset returns through automated smart contract strategies' },
  { title: 'NFT Management', icon: 'mdi-image-multiple', text: 'Manage and optimize your NFT assets to enhance their liquidity and value' }
]

const services = [
  { 
    title: 'Wallet Assets', 
    icon: 'mdi-wallet', 
    text: 'View and manage your wallet assets, including mainstream ERC-20 tokens, lesser-known tokens, and NFTs',
    btnText: 'View Assets',
    route: '/vault',
    color: 'primary'
  },
  { 
    title: 'Deposit Tokens', 
    icon: 'mdi-bank-plus', 
    text: 'Deposit tokens into smart contracts to earn higher returns and optimize your asset allocation',
    btnText: 'Deposit Tokens',
    route: '/vault',
    color: 'success'
  },
  { 
    title: 'Earnings Overview', 
    icon: 'mdi-chart-areaspline', 
    text: 'Check your earnings, including historical returns and expected rewards',
    btnText: 'View Earnings',
    route: '/earnings',
    color: 'info'
  }
]
</script>

<style scoped>
@media (max-width: 600px) {
  .text-h3 {
    font-size: 1.75rem !important;
  }
  
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .text-h5 {
    font-size: 1.25rem !important;
  }
  
  .v-card-title {
    font-size: 1.1rem !important;
  }
}
</style> 