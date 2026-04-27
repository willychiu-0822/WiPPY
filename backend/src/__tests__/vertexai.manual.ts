/**
 * 手動測試 Vertex AI 連線 — 不跑在 jest 裡
 * 執行方式：
 *   GCP_PROJECT_ID=你的專案ID LLM_PROVIDER=vertex_ai npx ts-node src/__tests__/vertexai.manual.ts
 */

import { createLLMProvider } from '../services/llmProvider';

process.env.LLM_PROVIDER = 'vertex_ai';
process.env.GCP_PROJECT_ID = process.env.GCP_PROJECT_ID ?? '';

async function main() {
  if (!process.env.GCP_PROJECT_ID) {
    console.error('請設定 GCP_PROJECT_ID 環境變數');
    process.exit(1);
  }

  console.log('使用專案:', process.env.GCP_PROJECT_ID);
  console.log('使用模型:', process.env.LLM_MODEL ?? 'gemini-3.1-flash-lite-preview');
  console.log('送出測試請求...\n');

  const provider = createLLMProvider();
  const reply = await provider.chat([
    { role: 'system', content: '你是一個活動規劃助理，用繁體中文回答。' },
    { role: 'user', content: '你好，請用一句話介紹你自己。' },
  ]);

  console.log('Gemini 回覆：');
  console.log(reply);
}

main().catch(err => {
  console.error('測試失敗：', err.message);
  process.exit(1);
});
