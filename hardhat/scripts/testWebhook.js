const axios = require('axios');
const crypto = require('crypto');

const webhookUrl = 'http://localhost:3000/webhook';
const secret = '你設定的 MULTIBAAS_SECRET_KEY';

const payload = JSON.stringify([
  {
    id: 'test-id',
    event: 'transaction.included',
    data: { dummy: true }
  }
]);

const timestamp = Math.floor(Date.now() / 1000).toString();
const hmac = crypto.createHmac('sha256', secret);
hmac.update(payload + timestamp);
const signature = hmac.digest('hex');

axios.post(webhookUrl, JSON.parse(payload), {
  headers: {
    'X-MultiBaas-Signature': signature,
    'X-MultiBaas-Timestamp': timestamp,
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('✅ 測試成功：', res.data);
})
.catch(err => {
  console.error('❌ 測試失敗：', err.response?.data || err.message);
});
