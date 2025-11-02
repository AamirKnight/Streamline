import { HfInference } from '@huggingface/inference';
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

  const hf = new HfInference(token);

  try {
    console.log('🔄 Testing with model: sentence-transformers/all-MiniLM-L6-v2');
    
    const result = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: 'Hello world',
    });

    console.log('✅ Token is valid!');
    console.log(`📊 Embedding dimension: ${Array.isArray(result[0]) ? result[0].length : result.length}`);
    console.log('✨ HuggingFace API is working correctly\n');

  } catch (error: any) {
    console.error('❌ Token test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Get a new token: https://huggingface.co/settings/tokens');
    console.log('2. Make sure you selected "Read" access');
    console.log('3. Update HF_TOKEN in your .env file');
    console.log('4. Restart your service\n');
  }
};

testHuggingFaceToken();