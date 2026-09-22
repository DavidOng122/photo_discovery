import { QwenProvider } from '../src/lib/ai/providers/qwen';
import { AnalyzeWalkInput } from '../src/lib/ai/provider';

async function run() {
  const provider = new QwenProvider();
  const input: AnalyzeWalkInput = {
    images: [{ url: 'https://picsum.photos/seed/test/200/300', order: 0 }],
    outputLanguage: 'ja'
  };
  
  try {
    const result = await provider.analyzeWalk(input);
    console.log("SUCCESS");
    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error("FAIL", err.message);
  }
}

run();
