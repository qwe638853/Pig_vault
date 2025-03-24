<template>
  <v-container>
    <!-- Page Title -->
    <h1 class="text-h4 mb-2">Earnings</h1>
    <p class="text-subtitle-2 text-medium-emphasis mb-6">
      Track your earnings in Pig Vault
    </p>

    <!-- Wallet Connection Prompt -->
    <v-card v-if="!isConnected" class="text-center pa-4 mb-6">
      <v-icon size="48" color="primary" class="mb-2">mdi-chart-areaspline</v-icon>
      <h2 class="text-h5 mb-2">Please Connect Your Wallet</h2>
      <p class="mb-3 text-body-2">Connect your wallet to track your investments and earnings</p>
      <v-btn 
        color="primary" 
        @click="connectWallet"
        :loading="loading.earnings"
      >
        Connect Wallet
      </v-btn>
    </v-card>

    <template v-else>
      <!-- Earnings Overview Card -->
      <v-card elevation="1" class="mb-6">
        <v-card-title class="bg-grey-lighten-3 d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-chart-areaspline</v-icon>
          <span>Earnings Overview</span>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col v-for="(stat, i) in [
              { title: 'Today\'s Earnings', value: todayEarnings, change: '+2.4%', color: 'success' },
              { title: 'Weekly Earnings', value: weeklyEarnings, change: '+5.1%', color: 'info' },
              { title: 'Total Earnings', value: totalEarnings, change: 'Cumulative', color: 'primary' }
            ]" :key="i" cols="12" sm="4">
              <v-card variant="tonal" :color="stat.color" class="mb-4 pa-4 text-center">
                <div class="text-subtitle-2 mb-2">{{ stat.title }}</div>
                <div class="text-h5 mb-1">${{ stat.value }}</div>
                <div class="text-caption">
                  <v-icon v-if="stat.title !== 'Total Earnings'" size="x-small">mdi-arrow-up</v-icon>
                  {{ stat.change }}
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
      
      <!-- Earnings Chart -->
      <v-card elevation="1" class="mb-6">
        <v-card-title class="bg-grey-lighten-3 d-flex justify-space-between align-center">
          <span>Earnings Trend</span>
          <v-btn-group density="comfortable" variant="outlined">
            <v-btn 
              v-for="period in ['week', 'month', 'year']" 
              :key="period"
              :color="selectedPeriod === period ? 'primary' : undefined"
              :variant="selectedPeriod === period ? 'flat' : 'text'"
              @click="changePeriod(period)"
            >
              {{ period === 'week' ? 'Week' : period === 'month' ? 'Month' : 'Year' }}
            </v-btn>
          </v-btn-group>
        </v-card-title>
        
        <v-card-text>
          <v-sheet v-if="loading.chart" height="250" class="d-flex align-center justify-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-sheet>
          <v-sheet v-else height="250" class="d-flex align-center justify-center">
            <div class="text-center">
              <v-icon size="42" color="grey-lighten-1">mdi-chart-areaspline</v-icon>
              <p class="mt-2">Chart Display Area</p>
            </div>
          </v-sheet>
        </v-card-text>
      </v-card>

      <!-- Earnings History -->
      <v-card elevation="1">
        <v-card-title class="bg-grey-lighten-3 d-flex justify-space-between align-center">
          <span>Earnings History</span>
          <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" @click="fetchEarnings" :loading="loading.earnings">
            Refresh
          </v-btn>
        </v-card-title>
        
        <v-data-table
          :headers="headers"
          :items="earningsHistory"
          :items-per-page="5"
          density="comfortable"
          class="elevation-0"
        >
          <template v-slot:item.token="{ item }">
            <div class="d-flex align-center">
              <v-avatar
                :color="item.token === 'ETH' ? 'blue' : 'green'"
                size="28"
                class="mr-2"
              >
                <span class="text-white">{{ item.token.charAt(0) }}</span>
              </v-avatar>
              <span>{{ item.token }}</span>
            </div>
          </template>
          
          <template v-slot:item.value="{ item }">
            <span class="text-success">${{ item.value }}</span>
          </template>
          
          <template v-slot:item.status="{ item }">
            <v-chip color="success" size="x-small">Received</v-chip>
          </template>
          
          <template v-slot:no-data>
            <div class="text-center pa-6">
              <v-icon size="42" color="grey-lighten-1">mdi-cash</v-icon>
              <div class="mt-2">No earnings data available</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </template>
  </v-container>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useDisplay } from 'vuetify'

const isConnected = inject('isConnected', ref(false))
const display = useDisplay()
const isMobile = display.mobile
const todayEarnings = ref('25.50')
const weeklyEarnings = ref('150.75')
const totalEarnings = ref('1,250.30')
const selectedPeriod = ref('week')
const loading = ref({
  earnings: false,
  chart: false
})

const headers = [
  { title: 'Date', key: 'date', sortable: true },
  { title: 'Token', key: 'token' },
  { title: 'Amount', key: 'amount', align: 'end' },
  { title: 'Value (USD)', key: 'value', align: 'end' },
  { title: 'Status', key: 'status', align: 'center' }
]

const earningsHistory = ref([
  {
    id: 1,
    date: '2024-03-24',
    token: 'ETH',
    amount: '0.1',
    value: '250.30',
    status: 'Received'
  },
  {
    id: 2,
    date: '2024-03-23',
    token: 'USDT',
    amount: '100',
    value: '100.00',
    status: 'Received'
  },
  {
    id: 3,
    date: '2024-03-22',
    token: 'ETH',
    amount: '0.05',
    value: '125.15',
    status: 'Received'
  },
  {
    id: 4,
    date: '2024-03-21',
    token: 'USDT',
    amount: '50',
    value: '50.00',
    status: 'Received'
  }
])

const connectWallet = async () => {
  try {
    loading.value.earnings = true
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      address.value = accounts[0]
      isConnected.value = true
      await fetchEarnings()
    } else {
      alert('Please install MetaMask wallet')
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    alert('Failed to connect wallet')
  } finally {
    loading.value.earnings = false
  }
}

const fetchEarnings = async () => {
  try {
    loading.value.earnings = true
    loading.value.chart = true
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1200))
    // Implement logic to fetch earnings data here
    // Using static data for demonstration
  } catch (error) {
    console.error('Failed to fetch earnings data:', error)
  } finally {
    loading.value.earnings = false
    loading.value.chart = false
  }
}

const changePeriod = (period) => {
  selectedPeriod.value = period
  loading.value.chart = true
  
  // Simulate loading new chart data
  setTimeout(() => {
    loading.value.chart = false
  }, 800)
}

onMounted(async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts.length > 0) {
      address.value = accounts[0]
      isConnected.value = true
      await fetchEarnings()
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