import { logger } from '@/lib/logger';
import { DataValidator } from '@/lib/dataValidation';
import { PromptComposer, type UserContext, type EphemerisContext, type PromptTemplate } from '@/prompts';
import { z } from 'zod';

// Simple HTML minifier for newsletter content
function minifyHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .replace(/\s+>/g, '>') // Remove whitespace before closing brackets
    .replace(/<\s+/g, '<') // Remove whitespace after opening brackets
    .trim();
}

// Content generation schemas
export const NewsletterSectionSchema = z.object({
  id: z.string(),
  heading: z.string().min(5).max(100),
  html: z.string().min(50),
  text: z.string().min(50),
  cta: z.object({
    label: z.string(),
    url: z.string().url()
  }).optional()
});

export const NewsletterContentSchema = z.object({
  subject: z.string().min(10).max(60),
  preheader: z.string().min(20).max(100),
  shareableSnippet: z.string().min(30).max(120),
  sections: z.array(NewsletterSectionSchema).min(1).max(5),
  generatedAt: z.string(),
  modelUsed: z.string(),
  tokenCount: z.number().positive(),
  perspective: z.enum(['calm', 'knowledge', 'success', 'evidence']),
  tier: z.enum(['free', 'basic', 'pro'])
});

export type NewsletterContent = z.infer<typeof NewsletterContentSchema>;
export type NewsletterSection = z.infer<typeof NewsletterSectionSchema>;

// Cost tracking for LLM usage
interface GenerationCosts {
  totalTokens: number;
  costUsd: number;
  model: string;
  tier: string;
}

// LLM model configurations and costs
const MODEL_CONFIGS: Record<string, { costPerToken: number; maxTokens: number; timeout: number }> = {
  'grok-3-mini': {
    costPerToken: 0.0000005, // $0.50 per 1M tokens
    maxTokens: 1000,
    timeout: 15000
  },
  'grok-3': {
    costPerToken: 0.0000015, // $1.50 per 1M tokens
    maxTokens: 1500,
    timeout: 20000
  },
  'grok-3-plus': {
    costPerToken: 0.000003, // $3.00 per 1M tokens
    maxTokens: 2000,
    timeout: 25000
  },
  'gpt-4o': {
    costPerToken: 0.000002, // $2.00 per 1M tokens (fallback)
    maxTokens: 1200,
    timeout: 20000
  }
};

// Circuit breaker for API failures
class LLMCircuitBreaker {
  private failureCount = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private threshold = 3;
  private timeout = 300000; // 5 minutes

  async call<T>(fn: () => Promise<T>, service: string): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = 'half-open';
        logger.info('LLM circuit breaker half-open', { service, component: 'llm-circuit-breaker' });
      } else {
        throw new Error(`LLM circuit breaker open for ${service}`);
      }
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure(service);
      throw error;
    }
  }

  private recordFailure(service: string): void {
    this.failureCount++;
    this.lastFailure = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      logger.error('LLM circuit breaker opened', {
        service,
        failures: this.failureCount,
        component: 'llm-circuit-breaker'
      });
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
}

// Grok API client
export class GrokClient {
  private circuitBreaker = new LLMCircuitBreaker();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(
    systemPrompt: string,
    userPrompt: string,
    modelConfig: PromptTemplate['modelConfig']
  ): Promise<{ content: NewsletterContent; tokensUsed: number }> {
    const startTime = Date.now();
    const generationId = this.generateId();

    logger.info('Grok content generation started', {
      generationId,
      model: modelConfig.model,
      maxTokens: modelConfig.maxTokens,
      component: 'grok-client'
    });

    return this.circuitBreaker.call(async () => {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelConfig.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: modelConfig.temperature,
          max_tokens: modelConfig.maxTokens,
          tools: [{
            type: "function",
            function: {
              name: "create_newsletter_content",
              description: "Generate structured newsletter content with proper sections",
              parameters: {
                type: "object",
                properties: {
                  subject: {
                    type: "string",
                    description: "Email subject line (10-60 characters)"
                  },
                  preheader: {
                    type: "string", 
                    description: "Email preview text (20-100 characters)"
                  },
                  shareableSnippet: {
                    type: "string",
                    description: "Social media ready quote (30-120 characters)"
                  },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        heading: { type: "string" },
                        html: { type: "string" },
                        text: { type: "string" },
                        cta: {
                          type: "object",
                          properties: {
                            label: { type: "string" },
                            url: { type: "string" }
                          }
                        }
                      },
                      required: ["id", "heading", "html", "text"]
                    }
                  }
                },
                required: ["subject", "preheader", "shareableSnippet", "sections"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "create_newsletter_content" } }
        }),
        signal: AbortSignal.timeout(MODEL_CONFIGS[modelConfig.model]?.timeout || 20000)
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const duration = Date.now() - startTime;

      if (!data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
        throw new Error('Invalid Grok API response structure');
      }

      const functionArgs = JSON.parse(data.choices[0].message.tool_calls[0].function.arguments);
      const tokensUsed = data.usage?.total_tokens || 0;

      // Construct NewsletterContent with metadata
      const content: NewsletterContent = {
        ...functionArgs,
        generatedAt: new Date().toISOString(),
        modelUsed: modelConfig.model,
        tokenCount: tokensUsed,
        perspective: this.extractPerspectiveFromPrompt(userPrompt),
        tier: this.extractTierFromPrompt(userPrompt)
      };

      logger.info('Grok content generation completed', {
        generationId,
        model: modelConfig.model,
        tokensUsed,
        duration,
        sectionsCount: content.sections.length,
        component: 'grok-client'
      });

      return { content, tokensUsed };
    }, 'grok');
  }

  private extractPerspectiveFromPrompt(prompt: string): 'calm' | 'knowledge' | 'success' | 'evidence' {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('peace') || lowerPrompt.includes('mindful') || lowerPrompt.includes('gentle')) return 'calm';
    if (lowerPrompt.includes('learn') || lowerPrompt.includes('education') || lowerPrompt.includes('understand')) return 'knowledge';
    if (lowerPrompt.includes('achieve') || lowerPrompt.includes('success') || lowerPrompt.includes('strategic')) return 'success';
    if (lowerPrompt.includes('research') || lowerPrompt.includes('evidence') || lowerPrompt.includes('analysis')) return 'evidence';
    return 'calm'; // Default fallback
  }

  private extractTierFromPrompt(prompt: string): 'free' | 'basic' | 'pro' {
    if (prompt.includes('comprehensive') || prompt.includes('enhanced') || prompt.includes('news')) return 'pro';
    if (prompt.includes('daily exploration') || prompt.includes('basic')) return 'basic';
    return 'free';
  }

  private generateId(): string {
    return `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// OpenAI fallback client
export class OpenAIClient {
  private circuitBreaker = new LLMCircuitBreaker();
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(
    systemPrompt: string,
    userPrompt: string,
    originalModelConfig: PromptTemplate['modelConfig']
  ): Promise<{ content: NewsletterContent; tokensUsed: number }> {
    const startTime = Date.now();
    const generationId = this.generateId();

    logger.info('OpenAI fallback generation started', {
      generationId,
      originalModel: originalModelConfig.model,
      component: 'openai-client'
    });

    return this.circuitBreaker.call(async () => {
      // Adapt prompt for OpenAI (no function calling in fallback)
      const adaptedPrompt = this.adaptPromptForOpenAI(userPrompt);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt + '\n\nIMPORTANT: Respond with valid JSON containing the required newsletter structure.' },
            { role: 'user', content: adaptedPrompt }
          ],
          temperature: originalModelConfig.temperature,
          max_tokens: MODEL_CONFIGS['gpt-4o'].maxTokens
        }),
        signal: AbortSignal.timeout(MODEL_CONFIGS['gpt-4o'].timeout)
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const duration = Date.now() - startTime;
      const tokensUsed = data.usage?.total_tokens || 0;

      // Parse JSON response
      let contentData;
      try {
        contentData = JSON.parse(data.choices[0].message.content);
      } catch (error) {
        throw new Error('Failed to parse OpenAI JSON response');
      }

      const content: NewsletterContent = {
        ...contentData,
        generatedAt: new Date().toISOString(),
        modelUsed: 'gpt-4o-fallback',
        tokenCount: tokensUsed,
        perspective: this.extractPerspectiveFromPrompt(userPrompt),
        tier: this.extractTierFromPrompt(userPrompt)
      };

      logger.info('OpenAI fallback generation completed', {
        generationId,
        tokensUsed,
        duration,
        sectionsCount: content.sections.length,
        component: 'openai-client'
      });

      return { content, tokensUsed };
    }, 'openai');
  }

  private adaptPromptForOpenAI(originalPrompt: string): string {
    return originalPrompt + `

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "subject": "Email subject (10-60 chars)",
  "preheader": "Preview text (20-100 chars)", 
  "shareableSnippet": "Social quote (30-120 chars)",
  "sections": [
    {
      "id": "unique-id",
      "heading": "Section title",
      "html": "<p>HTML formatted content</p>",
      "text": "Plain text version"
    }
  ]
}`;
  }

  private extractPerspectiveFromPrompt(prompt: string): 'calm' | 'knowledge' | 'success' | 'evidence' {
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('peace') || lowerPrompt.includes('mindful')) return 'calm';
    if (lowerPrompt.includes('learn') || lowerPrompt.includes('education')) return 'knowledge';
    if (lowerPrompt.includes('success') || lowerPrompt.includes('strategic')) return 'success';
    if (lowerPrompt.includes('research') || lowerPrompt.includes('evidence')) return 'evidence';
    return 'calm';
  }

  private extractTierFromPrompt(prompt: string): 'free' | 'basic' | 'pro' {
    if (prompt.includes('comprehensive') || prompt.includes('enhanced')) return 'pro';
    if (prompt.includes('exploration') || prompt.includes('basic')) return 'basic';
    return 'free';
  }

  private generateId(): string {
    return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Main content generation service
export class ContentGenerationService {
  private grokClient: GrokClient;
  private openaiClient: OpenAIClient;
  private kv: {
    content: KVNamespace;
    metrics: KVNamespace;
  };

  constructor(env: any) {
    this.grokClient = new GrokClient(env.GROK_API_KEY);
    this.openaiClient = new OpenAIClient(env.OPENAI_API_KEY);
    this.kv = {
      content: env.KV_CONTENT,
      metrics: env.KV_METRICS
    };
  }

  async generateContent(
    user: UserContext,
    ephemeris: EphemerisContext,
    newsContext?: string
  ): Promise<NewsletterContent> {
    const generationId = this.generateId();
    const startTime = Date.now();

    logger.info('Content generation started', {
      generationId,
      userId: user.perspective + '-' + user.tier,
      perspective: user.perspective,
      tier: user.tier,
      component: 'content-generation'
    });

    try {
      // Check cache first
      const cached = await this.getCachedContent(user, ephemeris.date);
      if (cached) {
        logger.info('Returning cached content', {
          generationId,
          cacheHit: true,
          component: 'content-generation'
        });
        return cached;
      }

      // Build prompt
      const promptData = PromptComposer.buildPrompt(user, ephemeris, newsContext);
      if (!promptData) {
        throw new Error('Failed to build prompt');
      }

      let content: NewsletterContent;
      let tokensUsed: number;
      let modelUsed: string;

      try {
        // Try Grok first
        const grokResult = await this.grokClient.generateContent(
          promptData.systemPrompt,
          promptData.userPrompt,
          promptData.template.modelConfig
        );
        content = grokResult.content;
        tokensUsed = grokResult.tokensUsed;
        modelUsed = promptData.template.modelConfig.model;

      } catch (grokError) {
        logger.warn('Grok generation failed, trying OpenAI fallback', {
          generationId,
          error: (grokError as Error).message,
          component: 'content-generation'
        });

        // Fallback to OpenAI
        const openaiResult = await this.openaiClient.generateContent(
          promptData.systemPrompt,
          promptData.userPrompt,
          promptData.template.modelConfig
        );
        content = openaiResult.content;
        tokensUsed = openaiResult.tokensUsed;
        modelUsed = 'gpt-4o-fallback';
      }

      // Validate generated content
      const validation = this.validateContent(content);
      if (!validation.isValid) {
        logger.error('Generated content failed validation', {
          generationId,
          errors: validation.errors,
          component: 'content-generation'
        });
        throw new Error(`Content validation failed: ${validation.errors?.join(', ')}`);
      }

      // Cache the content
      await this.cacheContent(user, ephemeris.date, content);

      // Track costs and metrics
      await this.trackGeneration(user, modelUsed, tokensUsed, Date.now() - startTime);

      const duration = Date.now() - startTime;
      logger.info('Content generation completed successfully', {
        generationId,
        modelUsed,
        tokensUsed,
        duration,
        sectionsCount: content.sections.length,
        component: 'content-generation'
      });

      return content;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Content generation failed', {
        generationId,
        error: (error as Error).message,
        duration,
        component: 'content-generation'
      });

      // Return fallback content
      return this.getFallbackContent(user, ephemeris);
    }
  }

  private async getCachedContent(user: UserContext, date: string): Promise<NewsletterContent | null> {
    const cacheKey = `content:${user.perspective}:${user.tier}:${date}`;
    
    try {
      const cached = await this.kv.content.get(cacheKey);
      if (cached) {
        const content = JSON.parse(cached);
        logger.debug('Cache hit for content', {
          cacheKey,
          component: 'content-generation'
        });
        return content;
      }
    } catch (error) {
      logger.warn('Cache retrieval failed', {
        cacheKey,
        error: (error as Error).message,
        component: 'content-generation'
      });
    }

    return null;
  }

  private async cacheContent(user: UserContext, date: string, content: NewsletterContent): Promise<void> {
    const cacheKey = `content:${user.perspective}:${user.tier}:${date}`;
    
    // Minify HTML content before caching to save storage space
    const minifiedContent = {
      ...content,
      sections: content.sections.map(section => ({
        ...section,
        html: minifyHTML(section.html)
      }))
    };
    
    const originalSize = JSON.stringify(content).length;
    const minifiedSize = JSON.stringify(minifiedContent).length;
    const compressionRatio = minifiedSize / originalSize;
    
    try {
      await this.kv.content.put(cacheKey, JSON.stringify(minifiedContent), {
        expirationTtl: 48 * 60 * 60 // 48 hours
      });
      
      logger.debug('Content cached successfully', {
        cacheKey,
        originalSize,
        minifiedSize,
        compressionRatio: Math.round(compressionRatio * 100),
        spaceSaved: Math.round((1 - compressionRatio) * 100),
        component: 'content-generation'
      });
    } catch (error) {
      logger.warn('Failed to cache content', {
        cacheKey,
        error: (error as Error).message,
        component: 'content-generation'
      });
    }
  }

  private validateContent(content: any): { isValid: boolean; errors?: string[] } {
    const result = NewsletterContentSchema.safeParse(content);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { isValid: false, errors };
    }

    // Additional quality checks
    const qualityErrors: string[] = [];

    // Check for profanity
    const textContent = content.sections.map((s: any) => s.text).join(' ');
    const filteredContent = DataValidator.filterProfaneContent(textContent);
    if (filteredContent !== textContent) {
      qualityErrors.push('Content contains inappropriate language');
    }

    // Check for minimum content quality
    if (content.sections.some((s: any) => s.text.length < 50)) {
      qualityErrors.push('Some sections are too short');
    }

    if (qualityErrors.length > 0) {
      return { isValid: false, errors: qualityErrors };
    }

    return { isValid: true };
  }

  private async trackGeneration(
    user: UserContext,
    modelUsed: string,
    tokensUsed: number,
    duration: number
  ): Promise<void> {
    const cost = tokensUsed * (MODEL_CONFIGS[modelUsed]?.costPerToken || MODEL_CONFIGS['grok-3-mini'].costPerToken);
    
    const metrics = {
      date: new Date().toISOString().split('T')[0],
      perspective: user.perspective,
      tier: user.tier,
      modelUsed,
      tokensUsed,
      costUsd: cost,
      duration,
      timestamp: new Date().toISOString()
    };

    const metricsKey = `generation_metrics:${Date.now()}:${user.perspective}`;
    
    try {
      await this.kv.metrics.put(metricsKey, JSON.stringify(metrics), {
        expirationTtl: 30 * 24 * 60 * 60 // 30 days
      });

      logger.info('Generation metrics tracked', {
        tokensUsed,
        costUsd: cost,
        modelUsed,
        component: 'content-generation'
      });
    } catch (error) {
      logger.warn('Failed to track generation metrics', {
        error: (error as Error).message,
        component: 'content-generation'
      });
    }
  }

  private getFallbackContent(user: UserContext, ephemeris: EphemerisContext): NewsletterContent {
    logger.info('Using fallback content', {
      perspective: user.perspective,
      tier: user.tier,
      component: 'content-generation'
    });

    const fallbackTemplates = {
      calm: {
        subject: "Your Cosmic Moment",
        preheader: "Take a breath and center yourself today",
        shareableSnippet: "The universe invites you to move with intention and find peace in the present moment.",
        sections: [{
          id: "daily-breath",
          heading: "Today's Gentle Reminder",
          html: "<p>The cosmic energy today encourages you to slow down and reconnect with your inner wisdom. Take three deep breaths and trust that you are exactly where you need to be.</p>",
          text: "The cosmic energy today encourages you to slow down and reconnect with your inner wisdom. Take three deep breaths and trust that you are exactly where you need to be."
        }]
      },
      knowledge: {
        subject: "Today's Cosmic Learning",
        preheader: "Expand your understanding of celestial patterns",
        shareableSnippet: "Every day offers new opportunities to understand the fascinating connections between cosmic cycles and human experience.",
        sections: [{
          id: "cosmic-insight",
          heading: "Today's Learning Opportunity",
          html: "<p>The planetary positions today create an excellent opportunity for observation and learning. Notice how cosmic rhythms might correlate with patterns in your daily experience.</p>",
          text: "The planetary positions today create an excellent opportunity for observation and learning. Notice how cosmic rhythms might correlate with patterns in your daily experience."
        }]
      },
      success: {
        subject: "Your Success Window",
        preheader: "Seize today's cosmic opportunities for growth",
        shareableSnippet: "Strategic action aligned with cosmic timing creates powerful momentum for achieving your goals.",
        sections: [{
          id: "success-action",
          heading: "Today's Strategic Advantage",
          html: "<p>The cosmic configuration supports bold action and clear decision-making. Focus your energy on high-priority goals and trust your instincts for optimal timing.</p>",
          text: "The cosmic configuration supports bold action and clear decision-making. Focus your energy on high-priority goals and trust your instincts for optimal timing."
        }]
      },
      evidence: {
        subject: "Today's Pattern Analysis",
        preheader: "Observe correlations in cosmic and personal cycles",
        shareableSnippet: "Careful observation of cosmic patterns provides valuable data for understanding cyclical influences in daily life.",
        sections: [{
          id: "pattern-observation",
          heading: "Today's Correlation Study",
          html: "<p>Today's planetary positions offer an opportunity to observe potential correlations between cosmic cycles and personal experience. Track your energy, mood, and interactions for data collection.</p>",
          text: "Today's planetary positions offer an opportunity to observe potential correlations between cosmic cycles and personal experience. Track your energy, mood, and interactions for data collection."
        }]
      }
    };

    const template = fallbackTemplates[user.perspective];
    
    return {
      ...template,
      generatedAt: new Date().toISOString(),
      modelUsed: 'fallback-content',
      tokenCount: 0,
      perspective: user.perspective,
      tier: user.tier
    };
  }

  private generateId(): string {
    return `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export main functions for scheduler integration
export async function generateNewsletterContent(
  user: UserContext,
  ephemeris: EphemerisContext,
  env: any,
  newsContext?: string
): Promise<NewsletterContent> {
  const service = new ContentGenerationService(env);
  return service.generateContent(user, ephemeris, newsContext);
} 