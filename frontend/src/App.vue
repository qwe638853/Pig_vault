<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const router = useRouter()
const display = useDisplay()
const isConnected = ref(false)
const address = ref('')
const drawer = ref(false)
const showHero = ref(true)
const pigAnimation = ref('idle')

// Provide reactive states to all components
provide('isConnected', isConnected)
provide('address', address)
provide('isMobile', display.mobile)

const connectWallet = async () => {
  try {
    if (typeof window.ethereum !== 'undefined') {
      pigAnimation.value = 'happy'
      setTimeout(() => {
        pigAnimation.value = 'idle'
      }, 2000)
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      address.value = accounts[0]
      isConnected.value = true
      showHero.value = false
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
  showHero.value = true
}

onMounted(async () => {
  if (typeof window.ethereum !== 'undefined') {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' })
    if (accounts.length > 0) {
      address.value = accounts[0]
      isConnected.value = true
      showHero.value = false
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
  <v-app class="app-container">
    <!-- Modern glassmorphic navigation bar -->
    <v-app-bar flat class="glass-nav">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
        <div class="d-flex align-center">
          <div class="pig-icon-wrapper">
            <v-icon size="large" color="primary" class="mr-2 pig-icon" :class="pigAnimation">mdi-pig-variant</v-icon>
          </div>
          <v-app-bar-title class="text-primary font-weight-bold">Pig Vault</v-app-bar-title>
        </div>
      </template>
      
      <div class="d-none d-md-flex ml-4">
        <v-btn 
          v-for="item in items" 
          :key="item.title" 
          :to="item.to" 
          variant="text" 
          class="mx-1 nav-btn"
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
          class="connect-btn"
        >
          Connect Wallet
        </v-btn>

        <template v-else>
          <v-chip color="success" class="mr-2 wallet-chip">
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
    
    <!-- Hero Section -->
    <v-fade-transition>
      <div v-if="showHero" class="hero-section">
        <div class="hero-content">
          <div class="pig-container">
            <div class="pig-body">
              <div class="pig-face">
                <div class="pig-eye left"></div>
                <div class="pig-eye right"></div>
                <div class="pig-nose"></div>
                <div class="pig-mouth"></div>
              </div>
              <div class="pig-ear left"></div>
              <div class="pig-ear right"></div>
            </div>
            <div class="coin-container">
              <div class="coin" v-for="n in 5" :key="n"></div>
            </div>
          </div>
          <h1 class="text-h1 font-weight-bold mb-4">Welcome to Pig Vault</h1>
          <p class="text-h5 mb-8">Your Smart Piggy Bank for Web3</p>
          <v-btn
            color="primary"
            size="x-large"
            class="connect-btn-hero"
            @click="connectWallet"
            prepend-icon="mdi-wallet"
          >
            Connect Your Wallet
          </v-btn>
        </div>
        <div class="hero-background">
          <div class="gradient-sphere"></div>
          <div class="gradient-sphere"></div>
          <div class="gradient-sphere"></div>
          <div class="floating-coins">
            <div class="coin" v-for="n in 10" :key="n"></div>
          </div>
        </div>
      </div>
    </v-fade-transition>
    
    <!-- Main content -->
    <v-main v-if="isConnected">
      <v-fade-transition mode="out-in">
        <router-view/>
      </v-fade-transition>
    </v-main>
    
    <!-- Modern footer -->
    <v-footer class="glass-footer">
      <v-container class="py-4">
        <div class="d-flex flex-column flex-sm-row justify-space-between align-center">
          <div class="d-flex align-center mb-2 mb-sm-0">
            <v-icon size="x-small" color="primary" class="mr-1">mdi-pig-variant</v-icon>
            <span class="text-caption">Pig Vault &copy; {{ new Date().getFullYear() }}</span>
          </div>
          <div class="d-flex">
            <v-btn icon="mdi-twitter" variant="text" color="primary" density="compact" size="x-small" class="mx-1"></v-btn>
            <v-btn icon="mdi-github" variant="text" color="primary" density="compact" size="x-small" class="mx-1"></v-btn>
            <v-btn icon="mdi-discord" variant="text" color="primary" density="compact" size="x-small" class="mx-1"></v-btn>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style>
/* Global styles */
html {
  overflow-x: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.app-container {
  background: transparent !important;
}

/* Pig Icon Animation */
.pig-icon-wrapper {
  position: relative;
  display: inline-block;
}

.pig-icon {
  transition: transform 0.3s ease;
}

.pig-icon.happy {
  animation: pigHappy 0.5s ease-in-out;
}

@keyframes pigHappy {
  0% { transform: scale(1); }
  50% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1); }
}

/* Hero Pig Animation */
.pig-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 2rem;
}

.pig-body {
  position: relative;
  width: 150px;
  height: 150px;
  background: #FFB6C1;
  border-radius: 50%;
  margin: 0 auto;
  animation: pigBounce 2s infinite ease-in-out;
}

.pig-face {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
}

.pig-eye {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #000;
  border-radius: 50%;
  top: 30%;
}

.pig-eye.left {
  left: 20%;
}

.pig-eye.right {
  right: 20%;
}

.pig-nose {
  position: absolute;
  width: 30px;
  height: 20px;
  background: #FF69B4;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pig-mouth {
  position: absolute;
  width: 40px;
  height: 20px;
  border-bottom: 3px solid #000;
  border-radius: 0 0 20px 20px;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.pig-ear {
  position: absolute;
  width: 40px;
  height: 40px;
  background: #FFB6C1;
  border-radius: 50%;
  top: 20%;
}

.pig-ear.left {
  left: -20px;
  transform: rotate(-30deg);
}

.pig-ear.right {
  right: -20px;
  transform: rotate(30deg);
}

@keyframes pigBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* Coin Animation */
.coin {
  position: absolute;
  width: 30px;
  height: 30px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: inset -5px -5px 10px rgba(0,0,0,0.3);
}

.coin::before {
  content: '$';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #B8860B;
  font-weight: bold;
}

.coin-container {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
}

.coin-container .coin {
  position: relative;
  animation: coinShake 0.5s infinite ease-in-out;
}

.coin-container .coin:nth-child(1) { animation-delay: 0s; }
.coin-container .coin:nth-child(2) { animation-delay: 0.1s; }
.coin-container .coin:nth-child(3) { animation-delay: 0.2s; }
.coin-container .coin:nth-child(4) { animation-delay: 0.3s; }
.coin-container .coin:nth-child(5) { animation-delay: 0.4s; }

@keyframes coinShake {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(10deg); }
}

.floating-coins {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.floating-coins .coin {
  position: absolute;
  animation: floatCoin 15s infinite linear;
}

.floating-coins .coin:nth-child(1) { left: 10%; top: 20%; animation-delay: 0s; }
.floating-coins .coin:nth-child(2) { left: 20%; top: 40%; animation-delay: -2s; }
.floating-coins .coin:nth-child(3) { left: 30%; top: 60%; animation-delay: -4s; }
.floating-coins .coin:nth-child(4) { left: 40%; top: 80%; animation-delay: -6s; }
.floating-coins .coin:nth-child(5) { left: 50%; top: 30%; animation-delay: -8s; }
.floating-coins .coin:nth-child(6) { left: 60%; top: 50%; animation-delay: -10s; }
.floating-coins .coin:nth-child(7) { left: 70%; top: 70%; animation-delay: -12s; }
.floating-coins .coin:nth-child(8) { left: 80%; top: 90%; animation-delay: -14s; }
.floating-coins .coin:nth-child(9) { left: 90%; top: 40%; animation-delay: -16s; }
.floating-coins .coin:nth-child(10) { left: 95%; top: 60%; animation-delay: -18s; }

@keyframes floatCoin {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) rotate(360deg);
    opacity: 0;
  }
}

/* Glassmorphic navigation */
.glass-nav {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

/* Navigation buttons */
.nav-btn {
  transition: all 0.3s ease;
  border-radius: 8px;
  padding: 8px 16px;
}

.nav-btn:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  transform: translateY(-2px);
}

/* Connect button */
.connect-btn {
  border-radius: 12px;
  padding: 8px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(var(--v-theme-primary), 0.2);
}

.connect-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(var(--v-theme-primary), 0.3);
}

/* Hero section */
.hero-section {
  position: relative;
  height: calc(100vh - 64px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  padding: 2rem;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.gradient-sphere {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle at center, rgba(var(--v-theme-primary), 0.2) 0%, transparent 70%);
  animation: float 20s infinite ease-in-out;
}

.gradient-sphere:nth-child(1) {
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.gradient-sphere:nth-child(2) {
  top: 50%;
  right: -100px;
  animation-delay: -5s;
}

.gradient-sphere:nth-child(3) {
  bottom: -100px;
  left: 50%;
  animation-delay: -10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  25% {
    transform: translate(50px, 50px);
  }
  50% {
    transform: translate(0, 100px);
  }
  75% {
    transform: translate(-50px, 50px);
  }
}

/* Connect button in hero */
.connect-btn-hero {
  padding: 16px 48px;
  font-size: 1.2rem;
  border-radius: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 30px rgba(var(--v-theme-primary), 0.3);
}

.connect-btn-hero:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 40px rgba(var(--v-theme-primary), 0.4);
}

/* Wallet chip */
.wallet-chip {
  border-radius: 12px;
  padding: 8px 16px;
  box-shadow: 0 4px 15px rgba(var(--v-theme-success), 0.2);
}

/* Glass footer */
.glass-footer {
  background: rgba(255, 255, 255, 0.8) !important;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .v-container {
    padding: 12px;
  }
  
  .hero-content h1 {
    font-size: 2.5rem !important;
  }
  
  .hero-content p {
    font-size: 1.2rem !important;
  }
  
  .gradient-sphere {
    width: 200px;
    height: 200px;
  }
  
  .pig-container {
    width: 150px;
    height: 150px;
  }
  
  .pig-body {
    width: 100px;
    height: 100px;
  }
}
</style>
