import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

async function testQwenText() {
  console.log('--- Testing Qwen Text ---');
  const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
  });
  
  try {
    const res = await openai.chat.completions.create({
      model: process.env.AI_TEXT_MODEL || 'qwen3.7-flash',
      messages: [{ role: 'user', content: 'こんにちは、あなたは誰ですか？ JSONで回答してください。' }],
      response_format: { type: 'json_object' }
    });
    console.log('Qwen Text Response:', res.choices[0]?.message?.content);
  } catch (err: any) {
    console.error('Qwen Text Error:', err.status, err.message);
  }
}

async function testQwenVision() {
  console.log('--- Testing Qwen Vision ---');
  const openai = new OpenAI({
    baseURL: process.env.AI_BASE_URL,
    apiKey: process.env.AI_API_KEY,
  });

  try {
    const res = await openai.chat.completions.create({
      model: process.env.AI_VISION_MODEL || 'qwen3.7-plus',
      messages: [{ 
        role: 'user', 
        content: [
          { type: 'text', text: 'What is this image? Reply in JSON format like {"description": "..."}' },
          { type: 'image_url', image_url: { url: 'https://picsum.photos/seed/picsum/200/300' } }
        ] 
      }],
      response_format: { type: 'json_object' }
    });
    console.log('Qwen Vision Response:', res.choices[0]?.message?.content);
  } catch (err: any) {
    console.error('Qwen Vision Error:', err.status, err.message);
  }
}

async function testTavily() {
  console.log('--- Testing Tavily ---');
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: '東京 散歩',
        include_images: true
      })
    });
    const data = await res.json();
    console.log(`Tavily Results Count: ${data.results?.length}`);
    console.log(`Tavily Images Type: ${Array.isArray(data.images) ? 'Array' : typeof data.images}`);
  } catch (err: any) {
    console.error('Tavily Error:', err.message);
  }
}

async function testSupabase() {
  console.log('--- Testing Supabase ---');
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  try {
    const { data, error } = await supabase.from('walks').select('id').limit(1);
    if (error) {
      console.log('Supabase Walks query error (maybe tables missing?):', error.message);
    } else {
      console.log('Supabase Walks query success. Data length:', data.length);
    }
  } catch (err: any) {
    console.error('Supabase Error:', err.message);
  }
}

async function run() {
  await testQwenText();
  await testQwenVision();
  await testTavily();
  await testSupabase();
}

run();
