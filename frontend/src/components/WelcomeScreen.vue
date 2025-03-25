<template>
  <v-row justify="center">
    <v-col cols="12" class="text-center">
      <div class="pig-container mb-4">
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
      <h2 class="text-h5 mb-2">Welcome to Pig Vault</h2>
      <p class="text-body-1 text-medium-emphasis mb-4">Enter a wallet address to find small tokens</p>
      
      <v-btn
        color="primary"
        size="large"
        @click="connectWallet"
        prepend-icon="mdi-wallet"
        class="mb-4"
      >
        Connect Wallet
      </v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
import { inject } from 'vue'

// 通過 inject 注入從 App.vue 提供的共享狀態
const isConnected = inject('isConnected')

// 觸發錢包連接事件
const connectWallet = () => {
  // 從父組件注入連接錢包方法，或創建自定義事件
  const event = new CustomEvent('connect-wallet')
  window.dispatchEvent(event)
}
</script>

<style scoped>
/* Pig Animation */
.pig-container {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto;
}

.pig-body {
  position: relative;
  width: 100px;
  height: 100px;
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
  width: 80px;
  height: 80px;
}

.pig-eye {
  position: absolute;
  width: 16px;
  height: 16px;
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
  width: 24px;
  height: 16px;
  background: #FF69B4;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pig-mouth {
  position: absolute;
  width: 32px;
  height: 16px;
  border-bottom: 2px solid #000;
  border-radius: 0 0 16px 16px;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
}

.pig-ear {
  position: absolute;
  width: 32px;
  height: 32px;
  background: #FFB6C1;
  border-radius: 50%;
  top: 20%;
}

.pig-ear.left {
  left: -16px;
  transform: rotate(-30deg);
}

.pig-ear.right {
  right: -16px;
  transform: rotate(30deg);
}

@keyframes pigBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Coin Animation */
.coin {
  position: absolute;
  width: 24px;
  height: 24px;
  background: #FFD700;
  border-radius: 50%;
  box-shadow: inset -4px -4px 8px rgba(0,0,0,0.3);
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
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
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
</style> 