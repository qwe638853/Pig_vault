<template>
  <v-container class="circle-test-container">
    <v-card class="pa-4">
      <v-card-title class="text-h5 mb-4">
        Circle SDK 測試頁面
      </v-card-title>

      <!-- 初始化狀態 -->
      <v-card-text>
        <v-alert
          :type="initStatus.type"
          :text="initStatus.message"
          class="mb-4"
        ></v-alert>
      </v-card-text>

      <!-- Passkey 註冊/登入 -->
      <v-card class="mb-4">
        <v-card-title class="text-h6">Passkey 註冊/登入</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="handlePasskeyAuth">
            <v-text-field
              v-model="authForm.username"
              label="用戶名稱"
              required
              class="mb-4"
            ></v-text-field>
            <v-select
              v-model="authForm.mode"
              :items="authModes"
              label="模式"
              required
              class="mb-4"
            ></v-select>
            <v-btn
              color="primary"
              type="submit"
              :loading="isAuthenticating"
              class="mb-4"
            >
              {{ authForm.mode === 'Register' ? '註冊' : '登入' }}
            </v-btn>
          </v-form>
        </v-card-text>
      </v-card>

      <!-- Smart Account 管理 -->
      <v-card class="mb-4" v-if="credential">
        <v-card-title class="text-h6">Smart Account 管理</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createSmartAccount">
            <v-select
              v-model="accountForm.chain"
              :items="chainOptions"
              label="區塊鏈"
              required
              class="mb-4"
            ></v-select>
            <v-btn
              color="primary"
              type="submit"
              :loading="isCreatingAccount"
              class="mb-4"
            >
              創建 Smart Account
            </v-btn>
          </v-form>

          <!-- 帳戶列表 -->
          <v-btn
            color="primary"
            @click="listAccounts"
            :loading="isLoadingAccounts"
            class="mb-4"
          >
            獲取帳戶列表
          </v-btn>

          <v-list v-if="accounts.length > 0">
            <v-list-item
              v-for="account in accounts"
              :key="account.address"
              :title="account.address"
              :subtitle="account.chain"
            >
              <template v-slot:prepend>
                <v-icon>mdi-account-key</v-icon>
              </template>
              <template v-slot:append>
                <v-chip
                  :color="account.status === 'active' ? 'success' : 'warning'"
                  size="small"
                >
                  {{ account.status }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-alert  
            v-else
            type="info"
            text="暫無 Smart Account"
          ></v-alert>
        </v-card-text>
      </v-card>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  toPasskeyTransport,
  toWebAuthnCredential,
  toModularTransport,
  toCircleSmartAccount,
  WebAuthnMode
} from '@circle-fin/modular-wallets-core';
import {
  createBundlerClient,
  toWebAuthnAccount,
} from 'viem/account-abstraction' 
import { createPublicClient } from 'viem'


// 環境變量
const clientKey = import.meta.env.VITE_CLIENT_KEY;
const clientUrl = import.meta.env.VITE_CLIENT_URL;

// 狀態
const initStatus = ref({
  type: 'info',
  message: '正在初始化...'
});

// 認證相關
const authForm = ref({
  username: '',
  mode: 'Register'
});
const isAuthenticating = ref(false);
const credential = ref(null);
const authModes = [
  { title: '註冊', value: 'Register' },
  { title: '登入', value: 'Login' }
];

// 帳戶相關
const accountForm = ref({
  chain: 'polygonAmoy'
});
const accounts = ref([]);
const isCreatingAccount = ref(false);
const isLoadingAccounts = ref(false);

// 區塊鏈選項
const chainOptions = [
  { title: 'Polygon Amoy', value: 'polygonAmoy' },
  { title: 'Ethereum Goerli', value: 'ethereumGoerli' },
  { title: 'Ethereum Mainnet', value: 'ethereumMainnet' }
];

// 處理 Passkey 認證
const handlePasskeyAuth = async () => {
  try {
    isAuthenticating.value = true;
    
    // 創建 Passkey Transport
    const passkeyTransport = toPasskeyTransport(clientUrl, clientKey);
    
    // 創建 WebAuthn 憑證
    credential.value = await toWebAuthnCredential({
      transport: passkeyTransport,
      mode: authForm.value.mode === 'Register' ? WebAuthnMode.Register : WebAuthnMode.Login,
      username: authForm.value.username
    });
    
    initStatus.value = {
      type: 'success',
      message: authForm.value.mode === 'Register' ? 'Passkey 註冊成功！' : 'Passkey 登入成功！'
    };
    
    // 獲取帳戶列表
    await listAccounts();
  } catch (error) {
    console.error('Passkey 認證失敗：', error);
    initStatus.value = {
      type: 'error',
      message: `認證失敗：${error.message}`
    };
  } finally {
    isAuthenticating.value = false;
  }
};

// 創建 Smart Account
const createSmartAccount = async () => {
  if (!credential.value) return;
  
  isCreatingAccount.value = true;
  try {
    // 創建 Modular Transport
    const modularTransport = toModularTransport(
      clientUrl + '/' + accountForm.value.chain,
      clientKey
    );
    
    // 創建 Public Client
    const client = createPublicClient({
      chain: accountForm.value.chain,
      transport: modularTransport
    });
    
    // 創建 Circle Smart Account
    const smartAccount = await toCircleSmartAccount({
      client,
      owner: toWebAuthnAccount({
        credential: credential.value
      })
    });
    
    // 創建 Bundler Client
    const bundlerClient = createBundlerClient({
      smartAccount,
      chain: accountForm.value.chain,
      transport: modularTransport
    });
    
    console.log('Smart Account 創建成功：', smartAccount);
    accounts.value.push({
      address: smartAccount.address,
      chain: accountForm.value.chain,
      status: 'active'
    });
  } catch (error) {
    console.error('創建 Smart Account 失敗：', error);
    initStatus.value = {
      type: 'error',
      message: `創建 Smart Account 失敗：${error.message}`
    };
  } finally {
    isCreatingAccount.value = false;
  }
};

// 獲取帳戶列表
const listAccounts = async () => {
  if (!credential.value) return;
  
  isLoadingAccounts.value = true;
  try {
    // 這裡需要實現獲取帳戶列表的邏輯
    // 目前使用模擬數據
    accounts.value = [
      {
        address: '0x1234...5678',
        chain: 'polygonAmoy',
        status: 'active'
      }
    ];
  } catch (error) {
    console.error('獲取帳戶列表失敗：', error);
    initStatus.value = {
      type: 'error',
      message: `獲取帳戶列表失敗：${error.message}`
    };
  } finally {
    isLoadingAccounts.value = false;
  }
};

// 組件掛載時初始化
onMounted(() => {
  initStatus.value = {
    type: 'success',
    message: '系統已就緒'
  };
});
</script>

<style scoped>
.circle-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
</style> 