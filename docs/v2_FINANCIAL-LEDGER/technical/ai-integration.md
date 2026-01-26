# AI 통합 정책

## 개요

AI는 계산 주체가 아닌 **분석/요약/해설 역할**로만 사용됩니다.

### AI 사용 예시

**✅ 적절한 사용:**
- 월간 가계부 요약 및 분석
- 지출 패턴 해설
- 예산 조언
- 구독 서비스 최적화 제안
- 영수증 OCR 및 자동 분류

**❌ 부적절한 사용:**
- 금액 계산 (직접 연산)
- 데이터 생성/수정
- 자동 거래 실행
- 투자 결정

---

## 지원 Provider

### 1. Google Gemini
```typescript
{
  provider: 'gemini',
  models: [
    'gemini-pro',
    'gemini-pro-vision'
  ],
  features: ['text', 'vision', 'multimodal']
}
```

**장점:**
- 무료 티어 제공
- 멀티모달 (텍스트 + 이미지)
- 빠른 응답

### 2. OpenAI
```typescript
{
  provider: 'openai',
  models: [
    'gpt-4',
    'gpt-4-turbo',
    'gpt-3.5-turbo'
  ],
  features: ['text', 'function-calling']
}
```

**장점:**
- 고품질 응답
- Function Calling 지원
- 안정적

### 3. Anthropic Claude
```typescript
{
  provider: 'anthropic',
  models: [
    'claude-3-opus',
    'claude-3-sonnet',
    'claude-3-haiku'
  ],
  features: ['text', 'long-context']
}
```

**장점:**
- 긴 컨텍스트
- 정확한 분석
- 안전성

### 4. Ollama (로컬)
```typescript
{
  provider: 'ollama',
  models: [
    'llama2',
    'mistral',
    'codellama'
  ],
  features: ['text', 'local']
}
```

**장점:**
- 완전 무료
- 프라이버시
- 오프라인 사용

---

## 설정

### 환경 변수

```env
AI_PROVIDER=gemini
AI_API_KEY=your-api-key
AI_MODEL=gemini-pro
```

### 웹 UI 설정

**설정 → AI:**
1. Provider 선택
2. API Key 입력
3. 모델 선택
4. 연결 테스트
5. 저장

---

## AI 추상화 레이어

### 인터페이스

```typescript
// packages/core/ai/index.ts

export interface AIProvider {
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
  generateStream(prompt: string, options?: GenerateOptions): AsyncIterator<string>;
  analyzeImage(image: Buffer, prompt: string): Promise<string>;
}

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}
```

### Provider 구현

```typescript
// packages/core/ai/providers/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;
  
  constructor(apiKey: string, model: string = 'gemini-pro') {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }
  
  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const model = this.client.getGenerativeModel({ 
      model: this.model 
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1000
      }
    });
    
    return result.response.text();
  }
  
  async *generateStream(prompt: string, options?: GenerateOptions) {
    const model = this.client.getGenerativeModel({ 
      model: this.model 
    });
    
    const result = await model.generateContentStream(prompt);
    
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
  
  async analyzeImage(image: Buffer, prompt: string): Promise<string> {
    const model = this.client.getGenerativeModel({ 
      model: 'gemini-pro-vision' 
    });
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: image.toString('base64'),
          mimeType: 'image/jpeg'
        }
      }
    ]);
    
    return result.response.text();
  }
}
```

### Provider 팩토리

```typescript
// packages/core/ai/factory.ts

export async function createAIProvider(userId: string): Promise<AIProvider> {
  // 사용자 설정 가져오기
  const config = await getAIConfig(userId);
  
  if (!config.provider || config.provider === 'none') {
    throw new Error('AI is not configured');
  }
  
  switch (config.provider) {
    case 'gemini':
      return new GeminiProvider(config.apiKey, config.model);
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.model);
    case 'anthropic':
      return new ClaudeProvider(config.apiKey, config.model);
    case 'ollama':
      return new OllamaProvider(config.model);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
```

---

## 사용 예시

### 1. 월간 가계부 요약

```typescript
// modules/ledger/backend/ai-summary.ts

export async function generateMonthlySummary(userId: string, month: string) {
  // 1. 데이터 조회
  const entries = await db.ledgerEntry.findMany({
    where: {
      user_id: userId,
      date: {
        gte: new Date(`${month}-01`),
        lt: new Date(`${month}-31`)
      }
    }
  });
  
  // 2. 통계 계산
  const stats = calculateStats(entries);
  
  // 3. AI 분석
  const ai = await createAIProvider(userId);
  
  const prompt = `
다음은 ${month}의 가계부 데이터입니다:

총 수입: ${stats.totalIncome}원
총 지출: ${stats.totalExpense}원
순액: ${stats.net}원

카테고리별 지출:
${stats.byCategory.map(c => `- ${c.name}: ${c.amount}원`).join('\n')}

이 데이터를 분석하여:
1. 주요 지출 패턴
2. 절약 가능한 부분
3. 다음 달 예산 제안

을 한국어로 간단명료하게 작성해주세요.
`;
  
  const summary = await ai.generate(prompt, {
    temperature: 0.7,
    maxTokens: 500
  });
  
  return summary;
}
```

### 2. 영수증 분석 (OCR)

```typescript
// modules/ledger/backend/receipt-ocr.ts

export async function analyzeReceipt(userId: string, imageBuffer: Buffer) {
  const ai = await createAIProvider(userId);
  
  const prompt = `
이 영수증 이미지에서 다음 정보를 추출해주세요:

1. 상호명
2. 총 금액
3. 결제 일시
4. 구매 항목들

JSON 형식으로 응답해주세요:
{
  "merchant": "상호명",
  "amount": 금액(숫자),
  "date": "YYYY-MM-DD",
  "items": ["항목1", "항목2"]
}
`;
  
  const result = await ai.analyzeImage(imageBuffer, prompt);
  
  // JSON 파싱
  const data = JSON.parse(result);
  
  return data;
}
```

### 3. 지출 패턴 분석

```typescript
// modules/ledger/backend/pattern-analysis.ts

export async function analyzeSpendingPattern(userId: string) {
  // 최근 3개월 데이터
  const entries = await getRecentEntries(userId, 90);
  
  const ai = await createAIProvider(userId);
  
  const prompt = `
다음은 최근 3개월간의 지출 데이터입니다:

${formatEntriesForAI(entries)}

다음을 분석해주세요:
1. 반복적인 지출 패턴
2. 비정상적인 지출
3. 절약 팁

간결하게 3-5개 문장으로 작성해주세요.
`;
  
  const analysis = await ai.generate(prompt);
  
  return analysis;
}
```

### 4. 구독 최적화 제안

```typescript
// modules/subscription/backend/optimization.ts

export async function suggestOptimization(userId: string) {
  const subscriptions = await db.subscription.findMany({
    where: { user_id: userId }
  });
  
  const ai = await createAIProvider(userId);
  
  const prompt = `
현재 구독 중인 서비스들:

${subscriptions.map(s => `- ${s.service_name}: ${s.amount}원/월`).join('\n')}

총 구독료: ${subscriptions.reduce((sum, s) => sum + s.amount, 0)}원/월

다음을 제안해주세요:
1. 중복된 서비스
2. 사용하지 않을 것 같은 서비스
3. 대체 가능한 저렴한 옵션

3-4개 문장으로 간결하게 작성해주세요.
`;
  
  const suggestions = await ai.generate(prompt);
  
  return suggestions;
}
```

---

## 스트리밍 응답

### Backend

```typescript
// apps/api/src/routes/ai.ts

router.post('/api/ai/analyze', authMiddleware, async (req, res) => {
  const { prompt, data } = req.body;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  try {
    const ai = await createAIProvider(req.user.id);
    
    for await (const chunk of ai.generateStream(prompt)) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
```

### Frontend

```typescript
// apps/web/src/hooks/useAIStream.ts

export function useAIStream() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const generate = async (prompt: string, data: any) => {
    setLoading(true);
    setText('');
    
    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ prompt, data })
    });
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            setLoading(false);
            return;
          }
          
          try {
            const { chunk } = JSON.parse(data);
            setText(prev => prev + chunk);
          } catch {}
        }
      }
    }
  };
  
  return { text, loading, generate };
}
```

---

## 비용 관리

### 사용량 추적

```typescript
// packages/core/ai/usage-tracker.ts

export class AIUsageTracker {
  async track(userId: string, provider: string, tokens: number, cost: number) {
    await db.aiUsage.create({
      data: {
        user_id: userId,
        provider,
        tokens,
        cost,
        timestamp: new Date()
      }
    });
  }
  
  async getMonthlyUsage(userId: string): Promise<UsageStats> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const usage = await db.aiUsage.aggregate({
      where: {
        user_id: userId,
        timestamp: { gte: startOfMonth }
      },
      _sum: {
        tokens: true,
        cost: true
      }
    });
    
    return {
      tokens: usage._sum.tokens || 0,
      cost: usage._sum.cost || 0
    };
  }
}
```

### 사용량 제한 (선택)

```typescript
// 월 1000회 제한 예시
const usage = await tracker.getMonthlyUsage(userId);

if (usage.requests > 1000) {
  throw new Error('Monthly AI usage limit exceeded');
}
```

---

## 에러 처리

### Retry 로직

```typescript
// packages/core/ai/utils.ts

export async function retryAICall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // 지수 백오프
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

// 사용
const summary = await retryAICall(() => 
  ai.generate(prompt)
);
```

### Fallback

```typescript
// AI 실패 시 기본 통계로 대체
try {
  const aiSummary = await generateAISummary(userId);
  return aiSummary;
} catch (error) {
  console.error('AI summary failed:', error);
  
  // 기본 통계 반환
  return generateBasicStats(userId);
}
```

---

## 캐싱

### 결과 캐싱

```typescript
// 동일한 요청은 캐시 사용
const cacheKey = `ai:summary:${userId}:${month}`;

// 캐시 확인
const cached = await cache.get(cacheKey);
if (cached) return cached;

// AI 호출
const result = await generateSummary(userId, month);

// 캐시 저장 (1시간)
await cache.set(cacheKey, result, 3600);

return result;
```

---

## 프롬프트 관리

### 템플릿 시스템

```typescript
// packages/core/ai/prompts.ts

export const PROMPTS = {
  monthlySummary: (stats: Stats) => `
다음은 이번 달 가계부 데이터입니다:

총 수입: ${stats.income}원
총 지출: ${stats.expense}원
순액: ${stats.net}원

카테고리별 지출:
${stats.categories.map(c => `- ${c.name}: ${c.amount}원`).join('\n')}

이 데이터를 분석하여 주요 인사이트를 3-5문장으로 작성해주세요.
`,
  
  receiptOCR: () => `
이 영수증에서 다음 정보를 JSON 형식으로 추출해주세요:
{
  "merchant": "상호명",
  "amount": 금액,
  "date": "YYYY-MM-DD",
  "items": ["항목들"]
}
`
};
```

---

## 보안

### API Key 보호

- 암호화하여 DB 저장
- 환경 변수로 관리 (선택)
- 프론트엔드에 절대 노출 금지

### Rate Limiting

```typescript
// AI API 호출 제한
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: 10, // 최대 10회
  message: 'Too many AI requests'
});

router.post('/api/ai/*', authMiddleware, limiter, async (req, res) => {
  // ...
});
```

---

## 사용자 제어

### AI 끄기

사용자가 언제든지 AI 기능을 비활성화할 수 있습니다:

```typescript
// 설정에서
await updateSettings(userId, 'ai', {
  provider: 'none'
});
```

AI가 비활성화되면 모든 AI 기능은 기본 통계로 대체됩니다.