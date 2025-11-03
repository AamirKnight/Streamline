import { config } from './config';

async function testHuggingFaceDirect() {
  console.log('🧪 Testing HuggingFace API (Direct Fetch)\n');

  try {
    // Check token
    console.log('1️⃣ Checking token...');
    if (!config.huggingface.apiKey) {
      throw new Error('HF_TOKEN is not set');
    }
    console.log(`✅ Token found: ${config.huggingface.apiKey.substring(0, 10)}...\n`);

    // Test with direct API call
    console.log('2️⃣ Testing direct API call...');
    const model = config.huggingface.model;
    // ✅ FIXED: Use /models/ endpoint, not /pipeline/feature-extraction/
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;
    
    console.log(`Model: ${model}`);
    console.log(`API URL: ${apiUrl}\n`);

    const testText = 'This is a test sentence for embeddings';
    console.log(`Input text: "${testText}"\n`);

    const startTime = Date.now();
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.huggingface.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: testText,
        options: {
          wait_for_model: true,
          use_cache: false,
        }
      }),
    });

    const endTime = Date.now();
    console.log(`⏱️  Request took: ${endTime - startTime}ms`);
    console.log(`Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response body:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid or expired token (401)');
      } else if (response.status === 403) {
        throw new Error('Token lacks necessary permissions (403)');
      } else if (response.status === 404) {
        throw new Error('Model not found (404) - check model name');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded (429) - wait and retry');
      } else if (response.status === 503) {
        throw new Error('Model is loading (503) - retry in 20 seconds');
      } else {
        throw new Error(`API error ${response.status}: ${errorText}`);
      }
    }

    const result = await response.json();
    console.log('Raw result type:', Array.isArray(result) ? 'array' : typeof result);
    
    if (Array.isArray(result) && result.length > 0) {
      console.log('First element type:', typeof result[0]);
      console.log('Array length:', result.length);
    }
    console.log();

    // Process result
    let embedding: number[];
    
    if (!Array.isArray(result)) {
      throw new Error('Result is not an array');
    }
    
    if (result.length === 0) {
      throw new Error('Empty result array');
    }
    
    // Check if it's a flat array of numbers
    if (typeof result[0] === 'number') {
      embedding = result;
      console.log('✅ Got flat embedding array');
    } 
    // Check if it's token embeddings (2D array)
    else if (Array.isArray(result[0])) {
      console.log('ℹ️  Got token embeddings, applying mean pooling...');
      const tokenEmbeddings = result as number[][];
      const numTokens = tokenEmbeddings.length;
      const dimension = tokenEmbeddings[0].length;
      
      console.log(`   Tokens: ${numTokens}, Dimension per token: ${dimension}`);
      
      embedding = new Array(dimension).fill(0);
      
      for (let i = 0; i < numTokens; i++) {
        for (let j = 0; j < dimension; j++) {
          embedding[j] += tokenEmbeddings[i][j];
        }
      }
      embedding = embedding.map(val => val / numTokens);
      console.log('✅ Mean pooling applied');
    } 
    else {
      throw new Error(`Unexpected result format: ${typeof result[0]}`);
    }

    console.log(`\n✅ Success! Embedding dimension: ${embedding.length}`);
    console.log(`Sample values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);

    // Verify dimension
    if (embedding.length === config.huggingface.embeddingDimension) {
      console.log(`✅ Dimension matches config (${config.huggingface.embeddingDimension})`);
    } else {
      console.warn(`⚠️  Dimension mismatch! Got ${embedding.length}, expected ${config.huggingface.embeddingDimension}`);
      console.log(`   Update embeddingDimension in config.ts to ${embedding.length}\n`);
    }

    // Test vector similarity
    console.log('\n3️⃣ Testing vector properties...');
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    console.log(`Vector magnitude: ${magnitude.toFixed(4)}`);
    
    const nonZero = embedding.filter(v => Math.abs(v) > 0.0001).length;
    console.log(`Non-zero values: ${nonZero}/${embedding.length}`);

    console.log('\n🎉 HuggingFace API is working perfectly!\n');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('1. Verify HF_TOKEN in .env file');
    console.error('2. Token should start with hf_');
    console.error('3. Get token from: https://huggingface.co/settings/tokens');
    console.error('4. Ensure token has "Read" access to Inference API');
    console.error('5. First request may take 20-30 seconds (model loading)');
    console.error('6. Try again in a minute if you see 503 errors\n');
  }
}

testHuggingFaceDirect();
