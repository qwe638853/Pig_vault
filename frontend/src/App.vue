<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const display = useDisplay()
const isConnected = ref(false)
const address = ref('')
const drawer = ref(false)

// Provide reactive states to all components
provide('isConnected', isConnected)
provide('address', address)
provide('isMobile', display.mobile)

const connectWallet = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      address.value = accounts[0]
      isConnected.value = true
    } else {
      alert('Please install MetaMask wallet')
    }
  } catch (error) {
    console.error('Failed to connect wallet:', error)
    alert('Failed to connect wallet')
  }
}

const disconnectWallet = () => {
  isConnected.value = false
  address.value = ''
}

onMounted(async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts.length > 0) {
      address.value = accounts[0]
      isConnected.value = true
    }
  }
})

const items = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  { title: 'Vault', icon: 'mdi-wallet', to: '/vault' },
  { title: 'Earnings', icon: 'mdi-cash', to: '/earnings' },
]
</script>

<template>
  <v-app>
    <!-- Simplified top navigation bar -->
    <v-app-bar flat>
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
        <div class="d-flex align-center">
          <v-icon size="large" color="primary" class="mr-2">mdi-pig-variant</v-icon>
          <v-app-bar-title class="text-primary font-weight-bold">Pig Vault</v-app-bar-title>
        </div>
      </template>
      
      <div class="d-none d-md-flex ml-4">
        <v-btn 
          v-for="item in items" 
          :key="item.title" 
          :to="item.to" 
          variant="text" 
          class="mx-1"
          :prepend-icon="item.icon"
        >
          {{ item.title }}
        </v-btn>
      </div>
      
      <v-spacer></v-spacer>
      
      <div>
        <v-btn 
          v-if="!isConnected"
          color="primary" 
          @click="connectWallet"
          prepend-icon="mdi-wallet"
        >
          Connect Wallet
        </v-btn>

        <template v-else>
          <v-chip color="success" class="mr-2">
            <template v-slot:prepend>
              <v-icon>mdi-check-circle</v-icon>
            </template>
            <span class="d-none d-sm-flex">{{ address.substring(0, 6) }}...{{ address.substring(address.length - 4) }}</span>
            <span class="d-flex d-sm-none">{{ address.substring(0, 4) }}...{{ address.substring(address.length - 2) }}</span>
          </v-chip>
          <v-btn 
            icon="mdi-logout"
            color="error" 
            variant="text"
            @click="disconnectWallet"
          ></v-btn>
        </template>
      </div>
    </v-app-bar>
    
    <!-- Simplified side navigation -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
    >
      <v-list>
        <v-list-item 
          prepend-icon="mdi-pig-variant" 
          title="Pig Vault"
          class="text-primary font-weight-bold"
        ></v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item 
          v-for="item in items" 
          :key="item.title" 
          :to="item.to" 
          :prepend-icon="item.icon"
          @click="drawer = false"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      <template v-slot:append>
        <v-divider></v-divider>
        <div class="pa-4">
          <v-btn 
            v-if="!isConnected"
            block
            color="primary"
            prepend-icon="mdi-wallet"
            @click="connectWallet"
          >
            Connect Wallet
          </v-btn>
          <template v-else>
            <v-chip color="success" class="mb-3 d-flex">
              <template v-slot:prepend>
                <v-icon>mdi-check-circle</v-icon>
              </template>
              {{ address.substring(0, 6) }}...{{ address.substring(address.length - 4) }}
            </v-chip>
            <v-btn 
              block 
              color="error" 
              prepend-icon="mdi-logout"
              @click="disconnectWallet"
            >
              Disconnect
            </v-btn>
          </template>
        </div>
      </template>
    </v-navigation-drawer>
    
    <!-- Main content -->
    <v-main>
      <v-fade-transition mode="out-in">
        <router-view/>
      </v-fade-transition>
    </v-main>
    
    <!-- Optimized footer -->
    <v-footer class="bg-primary py-2">
      <v-container class="py-0">
        <div class="d-flex flex-column flex-sm-row justify-space-between align-center">
          <div class="d-flex align-center mb-2 mb-sm-0">
            <v-icon size="x-small" color="white" class="mr-1">mdi-pig-variant</v-icon>
            <span class="text-caption text-white">Pig Vault &copy; {{ new Date().getFullYear() }}</span>
          </div>
          <div class="d-flex">
            <v-btn icon="mdi-twitter" variant="text" color="white" density="compact" size="x-small" class="mx-1"></v-btn>
            <v-btn icon="mdi-github" variant="text" color="white" density="compact" size="x-small" class="mx-1"></v-btn>
            <v-btn icon="mdi-discord" variant="text" color="white" density="compact" size="x-small" class="mx-1"></v-btn>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style>
/* Global styles to ensure content doesn't overflow on small screens */
html {
  overflow-x: hidden;
}

/* Ensure content area takes up more space */
.v-main {
  min-height: calc(100vh - 120px);
}

/* Ensure proper spacing on mobile */
@media (max-width: 600px) {
  .v-container {
    padding: 12px;
  }
  
  .v-main {
    min-height: calc(100vh - 100px);
  }
}
</style>
