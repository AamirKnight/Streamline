import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testHuggingFaceToken = async () => {
  console.log('🧪 Testing HuggingFace token...\n');

  const token = process.env.HF_TOKEN;

  if (!token) {
    console.error('❌ HF_TOKEN not found in environment variables');
    console.log('💡 Get a token from: https://huggingface.co/settings/tokens');
    return;
  }

  console.log(`📝 Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}\n`);

  const model = 'sentence-transformers/all-MiniLM-L6-v2';
  const url = `https://api-inference.huggingface.co/models/${model}`;

  try {
    console.log(`🔄 Testing with model: ${model}`);

    const start = Date.now();
    const response = await axios.post(
      url,
      { 
        inputs: {
          source_sentence: "Hello world",
          sentences: ["Hello world"]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    const end = Date.now();

    console.log('✅ Token is valid!');
    console.log(`⏱️ API latency: ${((end - start) / 1000).toFixed(2)}s`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    console.log('✨ HuggingFace API is working correctly\n');
  } catch (error: any) {
    console.error('❌ Token test failed:', error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    console.log('\n💡 Troubleshooting:');
    console.log('1. Ensure your token has "Read" access.');
    console.log('2. Check if model is loading (may take ~20s on first request).');
    console.log('3. Try a different model for feature extraction.');
    console.log('4. Visit: https://huggingface.co/settings/tokens\n');
  }
};

testHuggingFaceToken();

