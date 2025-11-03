import { config } from './config';
import logger from './utils/logger';
import fetch from 'node-fetch';

async function testHuggingFace() {
  console.log('🧪 Testing HuggingFace Connection\n');

  try {
    // Check token
    console.log('1️⃣ Checking token...');
    if (!config.huggingface.apiKey) {
      throw new Error('HF_TOKEN is not set');
    }
    console.log(`✅ Token found: ${config.huggingface.apiKey.substring(0, 10)}...\n`);

    // Test API call
    console.log('2️⃣ Testing API call...');
    const apiUrl = `${config.huggingface.apiUrl}/${config.huggingface.model}`;
    console.log(`API URL: ${apiUrl}\n`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.huggingface.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'This is a test sentence for embeddings',
        options: { wait_for_model: true }
      }),
    });

    console.log(`Status: ${response.status}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error: ${errorText}`);
      throw new Error(`API returned ${response.status}`);
    }

    const result = await response.json();
    console.log(`✅ Success! Received embedding with dimension: ${Array.isArray(result) && typeof result[0] === 'number' ? result.length : 'unknown'}`);
    console.log(`Sample values: [${Array.isArray(result) && typeof result[0] === 'number' ? result.slice(0, 5).map(v => v.toFixed(4)).join(', ') : 'N/A'}...]\n`);

    console.log('🎉 HuggingFace connection is working!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify HF_TOKEN is set in .env file');
    console.error('2. Token should start with hf_');
    console.error('3. Visit https://huggingface.co/settings/tokens to create a new token');
    console.error('4. Ensure token has Read permission');
  }
}

testHuggingFace();
