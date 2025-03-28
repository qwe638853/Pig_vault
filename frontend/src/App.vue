<script setup>
import { ref, onMounted, provide, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { ethers } from 'ethers'
import { useMotion } from '@vueuse/motion'
import anime from 'animejs'
import { useMouse, useParallax } from '@vueuse/core'
import { useDark, useToggle } from '@vueuse/core'
import { useScroll } from '@vueuse/core'
import ParticleBackground from './components/ParticleBackground.vue'

const router = useRouter()
const display = useDisplay()
const drawer = ref(false)
const isConnected = ref(false)
const address = ref('')
const showHero = ref(true)
const isMobile = ref(display.mobile)
const pigAnimation = ref('idle')
const isDark = useDark()
const toggleDark = useToggle(isDark)

// 性能控制
const isLowPerformanceMode = ref(false)
const particleCount = computed(() => isLowPerformanceMode.value ? 20 : 50)

// 檢測設備性能
const checkDevicePerformance = () => {
  // 移動設備默認使用低性能模式
  if (display.mobile.value || display.xs.value) {
    isLowPerformanceMode.value = true
    return
  }
  
  // 簡單的性能檢測
  const start = performance.now()
  let count = 0
  
  while (performance.now() - start < 5) {
    count++
  }
  
  // 基於簡單基準測試決定性能模式
  isLowPerformanceMode.value = count < 50000
}

// 提供值給子元件
provide('isConnected', isConnected)
provide('address', address)
provide('toggleDark', toggleDark)
provide('isDark', isDark)
provide('isLowPerformanceMode', isLowPerformanceMode)

// 視差效果
const target = ref(null)
const { tilt, roll } = useParallax(target)

// 滾動顯示效果
const { y } = useScroll(window)
const isVisible = ref(false)

// 滑鼠軌跡效果
const mouse = useMouse()
const particles = ref([])
const MAX_PARTICLES = 50

const createParticle = (x, y) => {
  return {
    x,
    y,
    size: Math.random() * 3 + 1,
    speedX: (Math.random() - 0.5) * 2,
    speedY: (Math.random() - 0.5) * 2,
    life: 1
  }
}

const updateParticles = () => {
  particles.value = particles.value
    .map(p => ({
      ...p,
      x: p.x + p.speedX,
      y: p.y + p.speedY,
      life: p.life - 0.01
    }))
    .filter(p => p.life > 0)

  if (particles.value.length < MAX_PARTICLES) {
    particles.value.push(
      createParticle(mouse.x.value, mouse.y.value)
    )
  }

  requestAnimationFrame(updateParticles)
}

// 打字效果
const text = "Your Smart Wallet, Web3 Asset Management Expert"
const displayText = ref('')
let currentIndex = 0

const typeText = () => {
  if (currentIndex < text.length) {
    displayText.value += text[currentIndex]
    currentIndex++
    setTimeout(typeText, 100)
  }
}

// 標題動畫相關的響應式數據
const titleVisible = ref(false)

// 側邊欄控制
const toggleDrawer = () => {
  drawer.value = !drawer.value
}

onMounted(() => {
  // 檢測設備性能
  checkDevicePerformance()

  // 初始化 Vanta.js 背景
  if (window.VANTA) {
    window.VANTA.NET({
      el: "#vanta-bg",
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0x00ffe0,
      backgroundColor: 0x0a0a0a,
      points: isLowPerformanceMode.value ? 10 : 15,
      maxDistance: 25.00,
      spacing: 18.00,
      showDots: false,
      blur: isLowPerformanceMode.value ? 0 : 1
    })
  }

  // 更新視窗大小時更新移動端狀態
  window.addEventListener('resize', () => {
    isMobile.value = display.mobile.value
  })

  // 開始粒子動畫
  updateParticles()

  // 開始打字動畫
  typeText()

  // 初始化硬幣動畫
  anime({
    targets: '.coin',
    translateY: function() {
      return anime.random(-30, 30)
    },
    translateX: function() {
      return anime.random(-30, 30)
    },
    rotate: function() {
      return anime.random(-360, 360)
    },
    scale: function() {
      return anime.random(0.8, 1.2)
    },
    duration: function() {
      return anime.random(1000, 3000)
    },
    delay: function() {
      return anime.random(0, 1000)
    },
    loop: true,
    easing: 'easeInOutQuad'
  })

  // 監聽來自 WelcomeScreen 的連接錢包事件
  window.addEventListener('connect-wallet', () => {
    connectWallet()
  })
  
  // 觸發標題動畫
  setTimeout(() => {
    titleVisible.value = true
  }, 500)
  
  return () => {
    window.removeEventListener('connect-wallet', connectWallet)
    window.removeEventListener('resize', () => {})
  }
})

const connectWallet = async () => {
  try {
    if (!window.ethereum) {
      alert('請先安裝 MetaMask!')
      return
    }

    // 請求用戶授權
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts',
      params: [{ eth_accounts: {} }]
    })
    
    // 請求用戶簽名
    const message = '歡迎使用 Pig Vault!\n\n請簽署此訊息以連接您的錢包。'
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, accounts[0]]
    })

    // 驗證簽名
    const recoveredAddress = ethers.verifyMessage(message, signature)
    if (recoveredAddress.toLowerCase() !== accounts[0].toLowerCase()) {
      throw new Error('簽名驗證失敗')
    }

    isConnected.value = true
    address.value = accounts[0]
    showHero.value = false
    
    // 觸發動畫效果
    anime({
      targets: '.pig-icon',
      scale: [1, 1.2, 1],
      rotate: [0, 10, 0],
      duration: 1000,
      easing: 'easeInOutQuad'
    })
    
    // 觸發自定義事件，通知其他元件錢包已連接
    window.dispatchEvent(new CustomEvent('wallet-connected', { 
      detail: { address: accounts[0] }
    }))
    
    // 導航到主頁（如果不在主頁）
    if (router.currentRoute.value.path !== '/') {
      router.push('/')
    }
  } catch (error) {
    console.error('連接錢包失敗:', error)
    alert('連接錢包失敗: ' + error.message)
  }
}

const disconnectWallet = async () => {
  try {
    isConnected.value = false
    address.value = ''
    showHero.value = true
    
    // 觸發自定義事件，通知其他元件錢包已斷開連接
    window.dispatchEvent(new CustomEvent('wallet-disconnected'))
    
    // 導航到主頁
    router.push('/')
  } catch (error) {
    console.error('斷開錢包失敗:', error)
  }
}

const items = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  { title: 'Vault', icon: 'mdi-wallet', to: '/vault' },
  { title: 'Earnings', icon: 'mdi-cash', to: '/earnings' },
  { title: 'Settings', icon: 'mdi-cog', to: '/settings' },
]

// 格式化地址顯示
const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
</script>

<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="app-container" ref="target">
    <!-- 將 ParticleBackground 移到這裡，確保它在最底層 -->
    <div class="background-wrapper">
      <ParticleBackground />
    </div>
    
    <!-- 粒子效果 -->
    <div class="particles">
      <div v-for="(particle, index) in particles" 
           :key="index" 
           class="particle"
           :style="{
             left: particle.x + 'px',
             top: particle.y + 'px',
             width: particle.size + 'px',
             height: particle.size + 'px',
             opacity: particle.life
           }">
      </div>
    </div>

    <!-- 側邊欄選單 (移動端) -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      :width="280"
      class="glass-nav-drawer"
    >
      <div class="drawer-header py-4 px-4">
        <div class="d-flex align-center">
          <v-avatar size="40" class="mr-4 gradient-bg">
            <span class="text-h6 font-weight-bold">PV</span>
          </v-avatar>
          <div class="brand-wrapper">
            <span class="brand-text">Pig</span>
            <span class="brand-highlight">Vault</span>
          </div>
        </div>
      </div>
      
      <v-divider></v-divider>
      
      <v-list class="transparent-bg">
        <v-list-item
          v-for="item in items"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :active="router.currentRoute.value.path === item.to"
          class="my-1"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>

        <v-divider class="my-3"></v-divider>
        
        <v-list-item v-if="isConnected" @click="disconnectWallet" prepend-icon="mdi-logout" class="my-1">
          <v-list-item-title>登出錢包</v-list-item-title>
          <v-list-item-subtitle>{{ formatAddress(address) }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item v-else @click="connectWallet" prepend-icon="mdi-wallet" class="my-1">
          <v-list-item-title>連接錢包</v-list-item-title>
        </v-list-item>
        
        <v-list-item @click="toggleDark()" prepend-icon="mdi-theme-light-dark" class="my-1">
          <v-list-item-title>{{ isDark ? '淺色模式' : '深色模式' }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- 主要佈局容器 -->
    <div class="layout-wrapper">
      <div class="layout-container max-w-screen-xl mx-auto px-4 px-sm-6">
        <!-- 導航欄 -->
        <v-app-bar flat class="glass-nav px-4 px-sm-6">
          <template v-slot:prepend>
            <v-app-bar-nav-icon 
              @click="toggleDrawer" 
              class="d-flex d-md-none"
            ></v-app-bar-nav-icon>
            
            <v-app-bar-title class="brand-title d-flex align-center">
              <div class="brand-wrapper">
                <span class="brand-text">Pig</span>
                <span class="brand-highlight">Vault</span>
              </div>
            </v-app-bar-title>
          </template>
          
          <v-spacer></v-spacer>
          
          <div class="d-none d-md-flex align-center gap-6">
            <v-btn 
              v-for="item in items" 
              :key="item.title" 
              :to="item.to" 
              variant="text" 
              class="nav-btn"
              :class="{ 'router-link-active': $route.path === item.to }"
            >
              {{ item.title }}
            </v-btn>
          </div>
          
          <template v-slot:append>
            <div class="d-flex align-center gap-2">
              <v-btn
                icon
                variant="text"
                @click="toggleDark()"
                class="mode-switch"
              >
                <v-icon>{{ isDark ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent' }}</v-icon>
              </v-btn>
              
              <v-btn 
                v-if="!isConnected"
                class="connect-btn glow-effect d-none d-sm-flex"
                @click="connectWallet"
              >
                Connect Wallet
              </v-btn>
            </div>
          </template>
        </v-app-bar>

        <!-- 主要內容區 -->
        <v-main>
          <!-- 背景粒子效果 -->
          <ParticleBackground class="particle-background" />

          <!-- 首頁內容 -->
          <div v-if="!isConnected" class="hero-container">
            <div class="hero-content" v-motion
              :initial="{ opacity: 0, y: 50 }"
              :enter="{ opacity: 1, y: 0 }"
              :delay="200">
              
              <!-- 主標題 -->
              <div class="title-wrapper" v-motion
                :initial="{ opacity: 0, scale: 0.8 }"
                :enter="{ opacity: 1, scale: 1 }"
                :delay="500">
                <h1 class="main-title">
                  <span class="title-line">Welcome to</span>
                  <span class="highlight-line">PigVault</span>
                </h1>
              </div>

              <!-- 副標題 -->
              <p class="hero-subtitle" v-motion
                :initial="{ opacity: 0 }"
                :enter="{ opacity: 1 }"
                :delay="800">
                Your Smart Wallet, Web3 Asset Management Expert
              </p>

              <!-- 連接按鈕 -->
              <v-btn
                class="connect-wallet-btn"
                size="x-large"
                v-motion
                :initial="{ opacity: 0, y: 20 }"
                :enter="{ opacity: 1, y: 0 }"
                :delay="1000"
                @click="connectWallet"
              >
                CONNECT WALLET
              </v-btn>
            </div>
          </div>

          <!-- 路由視圖 -->
          <router-view v-else></router-view>
        </v-main>

        <!-- 全域背景層 -->
        <div class="global-background-layer">
          <div class="enhanced-background" :class="{ 'low-performance': isLowPerformanceMode }">
            <div class="particles-container">
              <div v-for="n in particleCount" :key="n" 
                  class="particle-dot"
                  :style="{
                    '--x': `${Math.random() * 100}%`,
                    '--y': `${Math.random() * 100}%`,
                    '--size': `${Math.random() * 3 + 1}px`,
                    '--speed': `${Math.random() * 20 + 10}s`,
                    '--delay': `${Math.random() * -20}s`
                  }">
              </div>
            </div>
            <div class="gradient-overlay"></div>
          </div>
        </div>
      </div>

      <!-- 頁腳 -->
      <footer class="footer-wrapper">
        <div class="glass-footer">
          <div class="footer-container max-w-screen-xl mx-auto">
            <div class="footer-content">
              <div class="footer-left">
                <span class="copyright glow-text">&copy; {{ new Date().getFullYear() }} Pig Vault</span>
              </div>
              <div class="footer-right">
                <a href="#" class="footer-link">
                  <v-icon size="20" color="var(--neon-primary)">mdi-twitter</v-icon>
                  <span>Twitter</span>
                </a>
                <a href="#" class="footer-link">
                  <v-icon size="20" color="var(--neon-primary)">mdi-discord</v-icon>
                  <span>Discord</span>
                </a>
                <a href="#" class="footer-link">
                  <v-icon size="20" color="var(--neon-primary)">mdi-file-document-outline</v-icon>
                  <span>document</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </v-app>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

:root {
   --neon-primary: #00D4FF;
  --neon-secondary: #1E3A8A;
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #FFFFFF;
  --text-secondary: #E2E8F0;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.05);
  --glow-strength: 20px;
}

/* Global styles */
html {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Space Grotesk', sans-serif;
  overflow-x: hidden;
}

.app-container {
  background: transparent !important;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 添加背景包裝器樣式 */
.background-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* Background effects */
.vanta-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -3;
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
}

/* Particle effect */
.particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  background: var(--neon-primary);
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: screen;
}

/* Glass card effect */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  transition: all 0.3s ease;
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.glass-card:hover {
  border-color: var(--neon-primary);
  box-shadow: 0 0 var(--glow-strength) var(--neon-primary);
}

/* Navigation */
.glass-nav {
  background: rgba(10, 10, 10, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--glass-border);
  height: 72px !important;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.brand-title {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
}

/* Glow effects */
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

.glow-hover {
  transition: all 0.3s ease;
}

.glow-hover:hover {
  color: var(--neon-primary) !important;
  text-shadow: 0 0 10px var(--neon-primary);
}

.mode-switch {
  transition: all 0.3s ease;
}

.mode-switch:hover .v-icon {
  transform: rotate(30deg);
}

.glow-effect {
  position: relative;
  background: transparent;
  border: 1px solid var(--neon-primary);
  color: var(--neon-primary) !important;
  overflow: hidden;
  transition: all 0.3s ease;
}

.glow-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(0, 255, 224, 0.2),
    transparent
  );
  transition: 0.5s;
}

.glow-effect:hover {
  background: var(--neon-primary);
  color: var(--bg-primary) !important;
  box-shadow: 0 0 20px var(--neon-primary);
  transform: translateY(-2px) scale(1.05);
}

.glow-effect:hover::before {
  left: 100%;
}

/* Hero section */
.hero-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.hero-content {
  max-width: 1200px;
  text-align: center;
  padding: 2rem;
}

.title-wrapper {
  margin-bottom: 2rem;
}

.main-title {
  font-family: 'Sora', sans-serif;
  font-size: 120px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1rem;
}

/* 這裡改Welcome */

.title-line {  
  display: block;
  color:rgb(255, 255, 255);
  font-size: 50px;
  margin-bottom: 1rem;
  text-shadow: 
    0 0 10px rgba(0, 212, 255, 0.5),
    0 0 20px rgba(0, 212, 255, 0.2);
}



/* 這裡改PigVault */

.highlight-line {
  display: block;
  background: linear-gradient(135deg, #9370DB, #00BFFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 80px; /* 從 100px 減小到 80px */
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(0, 191, 255, 0.8), 0 0 2px rgba(0, 191, 255, 0.6), 0 0 30px rgba(147, 112, 219, 0.4);
  animation: glow 3s ease-in-out infinite;
}

/* 這裡改底下小字 */
.hero-subtitle {
  font-family: 'Poppins', sans-serif;
  font-weight: 300;
  font-size: 2rem;
  color: #D3D3D3;
  letter-spacing: 2px;
  animation: fadeIn 1s ease-in forwards;
}

/* Connect Wallet 按鈕樣式 */
.connect-wallet-btn {
  min-width: 200px !important;
  height: 56px !important;
  font-family: 'Sora', sans-serif;
  font-weight: 600;
  font-size: 18px;
  letter-spacing: 2px;
  background: linear-gradient(to right, var(--neon-primary), var(--neon-secondary)) !important;
  color: white !important;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
}

.connect-wallet-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
}

/* 響應式設計 */
@media (max-width: 1200px) {
  .main-title {
    font-size: 100px;
  }
  .title-line {
    font-size: 60px;
  }
  .highlight-line {
    font-size: 100px;
  }
}

@media (max-width: 768px) {
  .main-title {
    font-size: 80px;
  }
  .title-line {
    font-size: 40px;
  }
  .highlight-line {
    font-size: 80px;
  }
  .hero-subtitle {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 60px;
  }
  .title-line {
    font-size: 30px;
  }
  .highlight-line {
    font-size: 60px;
  }
  .hero-subtitle {
    font-size: 18px;
  }
  .connect-wallet-btn {
    min-width: 180px !important;
  }
}

/* Footer */
.glass-footer {
  background: rgba(10, 10, 10, 0.9) !important;
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--glass-border);
  padding: 24px 0;
  position: fixed;
  bottom: 0;
  width: 100%;
  z-index: 100;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.copyright {
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
}

.footer-right {
  margin-right: 2rem; /* 往左移動 */
  display: flex;
  gap: 2rem;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.footer-link:hover {
  opacity: 1;
  color: var(--neon-primary);
  transform: translateY(-1px);
}

.footer-link:hover .v-icon {
  filter: drop-shadow(0 0 8px var(--neon-primary));
}

/* Responsive */
@media (max-width: 960px) {
  .layout-container {
    padding-bottom: 140px; /* 移動端為頁腳預留更多空間 */
  }
  
  .hero-title {
    font-size: 3.5rem;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .title-line.highlight {
    text-shadow: 
      0 0 8px rgba(0, 255, 224, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    padding: 0 1rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .footer-right {
    gap: 1.5rem;
  }

  .brand-text, .brand-highlight {
    font-size: 1.5rem;
  }
  
  .particle-dot {
    --size: calc(var(--size) * 0.7);
    box-shadow: 
      0 0 8px rgba(0, 255, 224, 0.6),
      0 0 16px rgba(0, 255, 224, 0.3);
  }
  
  .glass-nav, .glass-footer {
    backdrop-filter: blur(5px);
  }
  
  .main-content {
    margin-top: 64px; /* 移動版導航欄高度調整 */
    min-height: calc(100vh - 154px);
  }
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .particle-dot {
    --size: calc(var(--size) * 0.5);
  }
  
  .enhanced-background {
    opacity: 0.6;
  }
  
  .main-content {
    margin-top: 56px;
  }
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@keyframes glow {
  0%, 100% { filter: drop-shadow(0 0 15px var(--neon-primary)); }
  50% { filter: drop-shadow(0 0 25px var(--neon-primary)); }
}

@keyframes borderGlow {
  0%, 100% { border-color: var(--neon-primary); }
  50% { border-color: var(--neon-secondary); }
}

.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.layout-container {
  flex: 1 0 auto;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  padding-bottom: 100px; /* 為 footer 預留空間 */
}

/* 品牌名稱樣式優化 */
.brand-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.brand-text {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.brand-highlight {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.75rem;
  background: linear-gradient(120deg, var(--neon-primary), var(--neon-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
}

.brand-underline {
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, var(--neon-primary), var(--neon-secondary));
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.brand-wrapper:hover .brand-underline {
  transform: scaleX(1);
}

/* Footer 定位優化 */
.footer-wrapper {
  width: 100%;
  margin-top: auto;
}

.glass-footer {
  background: transparent !important;
  backdrop-filter: none;
  backdrop-filter: blur(10px);
  border-top: 1px solid var(--glass-border);
  padding: 24px 0;
  width: 100%;
  z-index: 100;
}

.footer-container {
  width: 100%;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 響應式優化 - 背景效果 */
@media (max-width: 768px) {
  .layout-container {
    padding-bottom: 140px; /* 移動端為 footer 預留更多空間 */
  }
  
  .hero-title {
    font-size: 2.5rem;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .footer-right {
    gap: 1.5rem;
  }

  .brand-text, .brand-highlight {
    font-size: 1.5rem;
  }
}

/* 移除舊的金幣動畫相關樣式 */
.coins-shower, .coin-wrapper, .coin {
  display: none;
}

/* 背景層樣式 */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.enhanced-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.8;
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.particle-dot {
  position: absolute;
  left: var(--x);
  top: var(--y);
  width: var(--size);
  height: var(--size);
  background: rgba(0, 255, 224, 0.6);
  border-radius: 50%;
  animation: floatParticle var(--speed) linear infinite;
  animation-delay: var(--delay);
  filter: blur(1px);
  box-shadow: 
    0 0 15px rgba(0, 255, 224, 0.6),
    0 0 30px rgba(0, 255, 224, 0.3);
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(10, 10, 10, 0.3) 0%,
    rgba(10, 10, 10, 0.7) 100%
  );
}

/* 內容層樣式 */
.content-layer {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes floatParticle {
  0% {
    transform: translateZ(0) translateY(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
    transform: translateZ(100px) translateY(-20px) scale(1.2);
  }
  50% {
    transform: translateZ(300px) translateY(-50px) scale(1.5);
  }
  90% {
    opacity: 1;
    transform: translateZ(400px) translateY(-80px) scale(1.2);
  }
  100% {
    transform: translateZ(500px) translateY(-100px) scale(1);
    opacity: 0;
  }
}

@keyframes charReveal {
  0% {
    opacity: 0;
    transform: translateY(50px) scale(0.8);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 全域背景層樣式 */
.global-background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -2;
  pointer-events: none;
  overflow: hidden;
}

/* 主要內容區樣式 */
.main-content {
  position: relative;
  z-index: 10;
  background: transparent;
  width: 100%;
  padding: 0;
  flex-grow: 1;
}

/* 確保路由視圖內容正確顯示 */
.v-window__container {
  background: transparent;
}

/* 響應式優化 - 背景效果 */
@media (max-width: 768px) {
  .particle-dot {
    --size: calc(var(--size) * 0.7);
    box-shadow: 
      0 0 8px rgba(0, 255, 224, 0.6),
      0 0 16px rgba(0, 255, 224, 0.3);
  }
  
  .glass-nav, .glass-footer {
    backdrop-filter: blur(5px);
  }
  
  .main-content {
    margin-top: 64px; /* 移動版導航欄高度調整 */
    min-height: calc(100vh - 154px);
  }
}

@media (max-width: 600px) {
  .particle-dot {
    --size: calc(var(--size) * 0.5);
  }
  
  .enhanced-background {
    opacity: 0.6;
  }
  
  .main-content {
    margin-top: 56px;
  }
}

/* 高DPI屏幕優化 */
@media (min-width: 1920px) {
  .particle-dot {
    --size: calc(var(--size) * 1.5);
    box-shadow: 
      0 0 20px rgba(0, 255, 224, 0.6),
      0 0 40px rgba(0, 255, 224, 0.3);
  }
}

/* 性能優化相關樣式 */
.low-performance {
  opacity: 0.5;
}

.low-performance .particle-dot {
  animation-duration: calc(var(--speed) * 1.5);
  filter: none;
  box-shadow: 0 0 5px rgba(0, 255, 224, 0.5);
}
</style>
