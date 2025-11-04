import geminiService from './services/geminiService';
import { config } from './config';

async function runTests() {
  console.log('\n🚀 Starting AI Services Test...\n');

  // ✅ Debug: Check environment variables
  console.log('🔍 Environment Variable Check:');
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length || 0);
  console.log('GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10) || 'undefined');
  console.log('Config model:', config.gemini.model);
  console.log('Config has API key:', !!config.gemini.apiKey);
  console.log('Config API key length:', config.gemini.apiKey?.length || 0);
  console.log(''); // Empty line for readability

  // ✅ Test 1: GeminiService basic generation
  try {
    console.log('🧠 Testing Gemini text generation...');
    const text = await geminiService.generateText('Write one motivational quote.');
    console.log('✅ Gemini Response:', text, '\n');
  } catch (error) {
    console.error('❌ Gemini generation failed:', error);
  }

  // ✅ Test 2: Gemini summarization
  try {
    console.log('📝 Testing Gemini summarization...');
    const summary = await geminiService.summarize(
      `Artificial intelligence (AI) is a branch of computer science that aims to create intelligent machines 
      capable of performing tasks that typically require human intelligence.`
    );
    console.log('✅ Summary JSON:', summary, '\n');
  } catch (error) {
    console.error('❌ Gemini summarization failed:', error);
  }
}

runTests().catch((err) => console.error('Fatal Error:', err));
