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
const isMobile = display.mobile
const pigAnimation = ref('idle')
const isDark = useDark()
const toggleDark = useToggle(isDark)

// Parallax effect
const target = ref(null)
const { tilt, roll } = useParallax(target)

// Scroll reveal
const { y } = useScroll(window)
const isVisible = ref(false)

// Mouse trail effect
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

// Typing effect
const text = "Your Smart Piggy Bank for Web3"
const displayText = ref('')
let currentIndex = 0

const typeText = () => {
  if (currentIndex < text.length) {
    displayText.value += text[currentIndex]
    currentIndex++
    setTimeout(typeText, 100)
  }
}

// 添加標題動畫相關的響應式數據
const titleVisible = ref(false)

onMounted(() => {
  // Initialize Vanta.js background
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

  // Start particle animation
  updateParticles()

  // Start typing animation
  typeText()

  // 觸發標題動畫
  setTimeout(() => {
    titleVisible.value = true
  }, 500)
  
  return () => {
    window.removeEventListener('connect-wallet', connectWallet)
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
    const message = 'Welcome to Pig Vault!\n\nPlease sign this message to connect your wallet.'
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
  } catch (error) {
    console.error('連接錢包失敗:', error)
    alert('連接錢包失敗: ' + error.message)
  }
}

const disconnectWallet = async () => {
  try {
  isConnected.value = false
    address.value = null
    showHero.value = true
  } catch (error) {
    console.error('斷開錢包失敗:', error)
  }
}

const items = [
  { title: 'Home', icon: 'mdi-home', to: '/' },
  { title: 'Vault', icon: 'mdi-wallet', to: '/vault' },
  { title: 'Earnings', icon: 'mdi-cash', to: '/earnings' },
]
</script>

<template>
  <v-app class="app-container" ref="target">
    <div id="vanta-bg" class="vanta-background"></div>
    
    <!-- Particle effect -->
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

    <!-- Main Layout Container -->
    <div class="layout-wrapper">
      <div class="layout-container max-w-screen-xl mx-auto px-6">
        <!-- Navigation -->
        <v-app-bar flat class="glass-nav px-6">
        <div class="d-flex align-center">
            <v-app-bar-title class="brand-title">
              <div class="brand-wrapper">
                <span class="brand-text">Pig</span>
                <span class="brand-highlight">Vault</span>
                <div class="brand-underline"></div>
              </div>
            </v-app-bar-title>
        </div>
          
          <v-spacer></v-spacer>
      
          <div class="d-none d-md-flex align-center gap-6">
        <v-btn 
          v-for="item in items" 
          :key="item.title" 
          :to="item.to" 
          variant="text" 
              class="nav-btn glow-hover"
        >
          {{ item.title }}
        </v-btn>
      
        <v-btn 
          v-if="!isConnected"
              class="connect-btn glow-effect"
          @click="connectWallet"
        >
              <v-icon left class="mr-2">mdi-wallet</v-icon>
          Connect Wallet
        </v-btn>

        <template v-else>
              <div class="wallet-display glass-card">
                <v-icon left class="mr-2" color="var(--neon-primary)">mdi-wallet-outline</v-icon>
                {{ address.substring(0, 6) }}...{{ address.substring(address.length - 4) }}
              </div>
        </template>
      </div>
    </v-app-bar>
    
        <!-- Hero Section -->
        <div class="hero-section min-h-screen flex items-center justify-center">
          <!-- 背景層 -->
          <div class="background-layer">
            <div class="enhanced-background">
              <div class="particles-container">
                <div v-for="n in 50" :key="n" 
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

          <!-- 內容層 -->
          <div class="content-layer">
            <div class="hero-content text-center max-w-screen-xl mx-auto px-6">
              <!-- Main Title Group -->
              <div class="title-group mb-12">
                <h1 class="hero-title">
                  <div class="title-line">
                    <span class="title-char" v-for="(char, index) in 'Welcome to'"
                          :key="'welcome-'+index"
                          :style="{ '--char-delay': `${index * 0.05}s` }">
                      {{ char }}
                    </span>
                  </div>
                  <div class="title-line highlight" data-text="Pig Vault">
                    <span class="title-char" v-for="(char, index) in 'Pig Vault'"
                          :key="'pigvault-'+index"
                          :style="{ '--char-delay': `${index * 0.05}s` }">
                      {{ char }}
                    </span>
                  </div>
                </h1>
                <p class="hero-subtitle">{{ displayText }}</p>
              </div>

              <v-btn class="connect-btn-hero" @click="connectWallet">
                <v-icon class="wallet-icon mr-2">mdi-wallet</v-icon>
                CONNECT WALLET
              </v-btn>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <v-main v-if="isConnected" class="max-w-screen-xl mx-auto px-6">
      <v-fade-transition mode="out-in">
        <router-view/>
      </v-fade-transition>
    </v-main>
      </div>

      <!-- Footer -->
      <footer class="footer-wrapper">
        <div class="glass-footer">
          <div class="footer-container max-w-screen-xl mx-auto px-6">
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
                  <span>Docs</span>
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

/* Global styles */
html {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Space Grotesk', sans-serif;
}

.app-container {
  background: transparent !important;
  perspective: 1000px;
  transform-style: preserve-3d;
}

/* Background effects */
.vanta-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
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

.glow-hover {
  transition: all 0.3s ease;
}

.glow-hover:hover {
  color: var(--neon-primary) !important;
  text-shadow: 0 0 10px var(--neon-primary);
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
  font-family: 'Sora', sans-serif;
  font-size: clamp(4rem, 10vw, 8rem);
  font-weight: 800;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  color: #ffffff;
  text-shadow: 
    0 0 10px rgba(0, 255, 224, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.02em;
}

.title-line {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  overflow: visible;
  padding: 0.5rem 0;
}

.title-line.highlight {
  background: linear-gradient(135deg,
    rgb(255, 255, 255) 0%,
    rgb(0, 255, 224) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  text-shadow: 
    0 0 10px rgba(0, 255, 224, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.3);
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.02em;
  font-weight: 800;
}

.title-line.highlight::after {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(0, 255, 224, 0.95) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: blur(2px);
  opacity: 0.3;
  z-index: -1;
}

.title-char {
  display: inline-block;
  opacity: 0;
  transform: translateY(50px);
  animation: charReveal 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  animation-delay: var(--char-delay);
  text-rendering: geometricPrecision;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  will-change: transform, opacity;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-family: 'Space Grotesk', sans-serif;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 3rem;
  text-shadow: 
    0 0 20px rgba(0, 255, 224, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.8);
  font-weight: 500;
  letter-spacing: 0.5px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.neon-text {
  color: var(--neon-primary);
  text-shadow: 0 0 10px var(--neon-primary);
}

.connect-btn-hero {
  position: relative;
  z-index: 20;
  background: rgba(0, 255, 224, 0.1) !important;
  border: 1px solid rgba(0, 255, 224, 0.5) !important;
  color: #ffffff !important;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  letter-spacing: 2px;
  height: 56px;
  min-width: 240px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  backdrop-filter: blur(5px);
  box-shadow: 0 0 20px rgba(0, 255, 224, 0.1);
}

.connect-btn-hero:hover {
  background: rgba(0, 255, 224, 0.2) !important;
  border-color: rgba(0, 255, 224, 0.8) !important;
  transform: scale(1.05) translateY(-2px);
  box-shadow: 
    0 0 30px rgba(0, 255, 224, 0.2),
    inset 0 0 15px rgba(0, 255, 224, 0.1);
}

.connect-btn-hero:active {
  transform: scale(0.98);
  box-shadow: inset 0 0 20px rgba(0, 255, 224, 0.2);
}

/* Wallet display */
.wallet-display {
  padding: 8px 16px;
  font-family: 'Space Grotesk', monospace;
  color: var(--neon-primary);
  letter-spacing: 1px;
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
@media (max-width: 768px) {
  .hero-title {
    font-size: clamp(3rem, 8vw, 5rem);
    gap: 1rem;
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
  
  .particle-dot {
    --size: calc(var(--size) * 0.7);
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
  background: rgba(10, 10, 10, 0.9) !important;
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

/* 響應式優化 */
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
  width: 100%;
  height: 100%;
  opacity: 0.6;
}

.particles-container {
  position: absolute;
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
</style>
