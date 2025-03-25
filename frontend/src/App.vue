<script setup>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { ethers } from 'ethers'
import { useMotion } from '@vueuse/motion'
import anime from 'animejs'
import { useMouse, useParallax } from '@vueuse/core'
import { useDark, useToggle } from '@vueuse/core'
import { useScroll } from '@vueuse/core'

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

// 提供值給子元件
provide('isConnected', isConnected)
provide('address', address)
provide('toggleDark', toggleDark)
provide('isDark', isDark)

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
const text = "您的智能錢包，Web3 資產管理專家"
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
      points: 15,
      maxDistance: 25.00,
      spacing: 18.00,
      showDots: false,
      blur: 1
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
  { title: '首頁', icon: 'mdi-home', to: '/' },
  { title: '保險箱', icon: 'mdi-wallet', to: '/vault' },
  { title: '收益', icon: 'mdi-cash', to: '/earnings' },
  { title: '設定', icon: 'mdi-cog', to: '/settings' },
]

// 格式化地址顯示
const formatAddress = (addr) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}
</script>

<template>
  <v-app :theme="isDark ? 'dark' : 'light'" class="app-container" ref="target">
    <div id="vanta-bg" class="vanta-background"></div>
    
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
                <div class="brand-underline"></div>
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
              class="nav-btn glow-hover"
              :active="router.currentRoute.value.path === item.to"
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
                <v-icon left class="mr-2">mdi-wallet</v-icon>
                連接錢包
              </v-btn>

              <div v-else class="wallet-display glass-card d-none d-sm-flex">
                <v-icon left class="mr-2" color="var(--neon-primary)">mdi-wallet-outline</v-icon>
                {{ formatAddress(address) }}
                <v-btn 
                  icon 
                  size="small" 
                  class="ml-2" 
                  variant="text" 
                  @click="disconnectWallet" 
                  title="登出錢包"
                >
                  <v-icon size="small">mdi-logout</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </v-app-bar>

        <!-- 英雄區域 -->
        <v-fade-transition>
          <div v-if="showHero" class="hero-section min-h-screen flex items-center justify-center" 
               :style="{
                 '--tilt-x': tilt + 'deg',
                 '--tilt-y': roll + 'deg'
               }">
            <div class="hero-content" 
                 v-motion
                 :initial="{ opacity: 0, y: 100 }"
                 :enter="{ opacity: 1, y: 0 }">
              
              <!-- 動畫小豬和硬幣 -->
              <div class="relative mb-16">
                <div class="pig-container">
                  <lottie-player
                    src="@/assets/pig-animation.json"
                    background="transparent"
                    speed="1"
                    class="pig-animation"
                    loop
                    autoplay
                  ></lottie-player>
                </div>
                
                <!-- 硬幣效果 -->
                <div class="coins-shower">
                  <template v-for="n in 12" :key="n">
                    <div class="coin-wrapper"
                         :style="{
                           '--delay': `${n * 0.2}s`,
                           '--x-pos': `${(n % 3 - 1) * 30}px`
                         }">
                      <div class="coin"></div>
                    </div>
                  </template>
                </div>
              </div>

              <!-- 英雄文本 -->
              <div class="text-center space-y-8">
                <h1 class="hero-title">
                  <span class="title-word">歡迎使用</span>
                  <span class="title-word highlight">Pig Vault</span>
                </h1>
                
                <p class="hero-subtitle neon-text">{{ displayText }}</p>
                
                <v-btn
                  class="connect-btn-hero glow-effect mt-12"
                  @click="connectWallet"
                  v-motion
                  :initial="{ scale: 0.8, opacity: 0 }"
                  :enter="{ scale: 1, opacity: 1 }"
                >
                  <v-icon left class="mr-2">mdi-wallet</v-icon>
                  連接錢包
                </v-btn>
              </div>
            </div>
          </div>
        </v-fade-transition>

        <!-- 主要內容區 -->
        <v-main class="max-w-screen-xl mx-auto" :class="{ 'pt-0': isConnected && !showHero }">
          <v-fade-transition mode="out-in">
            <router-view v-if="isConnected || !showHero"/>
          </v-fade-transition>
        </v-main>
      </div>

      <!-- 頁腳 -->
      <footer class="footer-wrapper">
        <div class="glass-footer">
          <div class="footer-container max-w-screen-xl mx-auto px-4 px-sm-6">
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
                  <span>文件</span>
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
  --neon-primary: #00ffe0;
  --neon-secondary: #ff3cbf;
  --bg-primary: #0a0a0a;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-border: rgba(255, 255, 255, 0.05);
  --glow-strength: 20px;
}

/* 全局樣式 */
html {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Space Grotesk', sans-serif;
  overflow-x: hidden;
}

.app-container {
  background: transparent !important;
  perspective: 1000px;
  transform-style: preserve-3d;
}

/* 背景效果 */
.vanta-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
}

.transparent-bg {
  background-color: transparent !important;
}

/* 粒子效果 */
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

/* 玻璃卡片效果 */
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

/* 導航 */
.glass-nav {
  background: rgba(10, 10, 10, 0.8) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--glass-border);
  height: 72px !important;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.glass-nav-drawer {
  background: rgba(10, 10, 10, 0.9) !important;
  backdrop-filter: blur(15px);
}

.drawer-header {
  border-bottom: 1px solid var(--glass-border);
}

.gradient-bg {
  background: linear-gradient(135deg, var(--neon-primary), var(--neon-secondary));
}

.brand-title {
  font-family: 'Sora', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
}

/* 發光效果 */
.glow-text {
  color: var(--text-primary);
  text-shadow: 0 0 10px var(--neon-primary);
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

/* 英雄區域 */
.hero-section {
  padding: 72px 0;
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  transform: 
    perspective(1000px)
    rotateX(calc(var(--tilt-y) * 0.5deg))
    rotateY(calc(var(--tilt-x) * 0.5deg));
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
}

.pig-container {
  width: 240px;
  height: 240px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.pig-animation {
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 0 30px var(--neon-primary));
}

.coins-shower {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 400px;
  pointer-events: none;
}

.coin-wrapper {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(var(--x-pos));
  animation: coinFall 2s var(--delay) infinite;
}

.coin {
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #ffd700, #ffa500);
  border-radius: 50%;
  position: relative;
  animation: coinSpin 1s linear infinite;
}

.coin::after {
  content: '$';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #b8860b;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

@keyframes coinFall {
  0% {
    transform: translateY(-50px) translateX(var(--x-pos));
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  60% {
    transform: translateY(200px) translateX(calc(var(--x-pos) + 20px));
    opacity: 1;
  }
  100% {
    transform: translateY(300px) translateX(calc(var(--x-pos) + 30px));
    opacity: 0;
  }
}

@keyframes coinSpin {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}

.hero-title {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  font-family: 'Sora', sans-serif;
  font-size: 5rem;
  line-height: 1.1;
  margin-bottom: 2rem;
}

.title-word {
  display: inline-block;
  position: relative;
  color: var(--text-primary);
  animation: titleFloat 3s ease-in-out infinite;
}

.title-word.highlight {
  background: linear-gradient(120deg, var(--neon-primary), var(--neon-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 15px var(--neon-primary));
  animation: titleGlow 3s ease-in-out infinite;
}

.title-word::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--neon-primary), transparent);
  transform: scaleX(0);
  transform-origin: center;
  animation: lineReveal 1.5s ease forwards;
}

@keyframes titleFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes titleGlow {
  0%, 100% {
    filter: drop-shadow(0 0 15px var(--neon-primary));
  }
  50% {
    filter: drop-shadow(0 0 30px var(--neon-primary));
  }
}

@keyframes lineReveal {
  0% {
    transform: scaleX(0);
    opacity: 0;
  }
  100% {
    transform: scaleX(1);
    opacity: 1;
  }
}

.hero-subtitle {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.5rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  opacity: 0.8;
}

.neon-text {
  color: var(--neon-primary);
  text-shadow: 0 0 10px var(--neon-primary);
}

.connect-btn-hero {
  background: transparent !important;
  border: 2px solid var(--neon-primary) !important;
  color: var(--neon-primary) !important;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  letter-spacing: 2px;
  height: 56px;
  min-width: 240px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.connect-btn-hero:hover {
  background: var(--neon-primary) !important;
  color: var(--bg-primary) !important;
  box-shadow: 0 0 30px var(--neon-primary);
  transform: translateY(-2px) scale(1.05);
}

/* 錢包顯示 */
.wallet-display {
  font-family: 'Space Grotesk', monospace;
  color: var(--neon-primary);
  letter-spacing: 1px;
}

/* 頁腳 */
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

/* 深色模式適配 */
.v-theme--dark {
  --glass-bg: rgba(0, 0, 0, 0.3);
  --glass-border: rgba(255, 255, 255, 0.1);
}

.v-theme--light {
  --neon-primary: #0091ff;
  --neon-secondary: #9c00ff;
  --bg-primary: #f5f5f5;
  --bg-secondary: #e0e0e0;
  --text-primary: #333333;
  --text-secondary: rgba(0, 0, 0, 0.7);
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-border: rgba(0, 0, 0, 0.1);
}

.v-theme--light .vanta-background {
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
}

/* 佈局相關 */
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
  padding-bottom: 100px; /* 為頁腳預留空間 */
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

/* 頁腳定位優化 */
.footer-wrapper {
  width: 100%;
  margin-top: auto;
}

/* 響應式優化 */
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

@media (max-width: 600px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1.2rem;
  }
  
  .coin-wrapper {
    display: none;
  }
  
  .pig-container {
    width: 200px;
    height: 200px;
  }
}

/* 動畫 */
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

/* 活躍路由高亮 */
.v-btn.v-btn--active {
  color: var(--neon-primary) !important;
  text-shadow: 0 0 10px var(--neon-primary);
}

.v-list-item--active {
  background: linear-gradient(90deg, rgba(0, 255, 224, 0.1), transparent) !important;
  border-left: 3px solid var(--neon-primary);
}

/* v-main 內容區域的頂部間距，避免被導航欄遮擋 */
.v-main {
  padding-top: 92px !important;
}

.v-main.pt-0 {
  padding-top: 72px !important;
}
</style>
