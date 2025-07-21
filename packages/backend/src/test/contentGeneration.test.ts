import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContentGenerationService, GrokClient, OpenAIClient, NewsletterContentSchema } from '../services/contentGeneration';
import { PromptComposer } from '../prompts';
import type { UserContext, EphemerisContext } from '../prompts';

// Mock environment
const mockEnv = {
  GROK_API_KEY: 'test-grok-key',
  OPENAI_API_KEY: 'test-openai-key',
  KV_CONTENT: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  },
  KV_METRICS: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
};

// Mock user context
const mockUser: UserContext = {
  perspective: 'calm',
  focusAreas: ['wellness', 'spiritual'],
  tier: 'basic',
  birthLocation: 'New York, NY',
  timezone: 'America/New_York'
};

// Mock ephemeris context
const mockEphemeris: EphemerisContext = {
  date: '2024-01-20',
  sunPosition: { sign: 'Aquarius', degree: 1.5 },
  moonPosition: { sign: 'Cancer', degree: 15.2, phase: 'Waxing Gibbous' },
  majorAspects: [
    { planet1: 'sun', planet2: 'moon', aspect: 'trine', orb: 2.1 }
  ],
  retrogradeActivePlanets: ['mercury']
};

// Mock content response
const mockNewsletterContent = {
  subject: "Your Cosmic Moment",
  preheader: "Take a breath and center yourself today",
  shareableSnippet: "The universe invites you to move with intention and find peace.",
  sections: [
    {
      id: "daily-breath",
      heading: "Today's Gentle Reminder",
      html: "<p>The cosmic energy today encourages you to slow down and reconnect with your inner wisdom.</p>",
      text: "The cosmic energy today encourages you to slow down and reconnect with your inner wisdom."
    }
  ]
};

// Mock external APIs
global.fetch = vi.fn();

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('../prompts', () => ({
  PromptComposer: {
    buildPrompt: vi.fn(() => ({
      systemPrompt: 'Test system prompt',
      userPrompt: 'Test user prompt',
      template: {
        id: 'calm-daily-basic',
        modelConfig: {
          model: 'grok-3-mini',
          temperature: 0.7,
          maxTokens: 400
        }
      }
    }))
  }
}));

describe('Content Generation Service', () => {
  let service: ContentGenerationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ContentGenerationService(mockEnv);
  });

  describe('Content Schema Validation', () => {
    it('should validate correct newsletter content', () => {
      const validContent = {
        ...mockNewsletterContent,
        generatedAt: new Date().toISOString(),
        modelUsed: 'grok-3-mini',
        tokenCount: 150,
        perspective: 'calm' as const,
        tier: 'basic' as const
      };

      const result = NewsletterContentSchema.safeParse(validContent);
      expect(result.success).toBe(true);
    });

    it('should reject content with invalid structure', () => {
      const invalidContent = {
        subject: 'x', // Too short
        preheader: 'y', // Too short
        sections: [] // Empty sections
      };

      const result = NewsletterContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });

    it('should reject content with invalid section structure', () => {
      const invalidContent = {
        ...mockNewsletterContent,
        sections: [
          {
            id: "test",
            heading: "Test",
            html: "x", // Too short
            text: "y"  // Too short
          }
        ],
        generatedAt: new Date().toISOString(),
        modelUsed: 'grok-3-mini',
        tokenCount: 150,
        perspective: 'calm' as const,
        tier: 'basic' as const
      };

      const result = NewsletterContentSchema.safeParse(invalidContent);
      expect(result.success).toBe(false);
    });
  });

  describe('Grok API Integration', () => {
    let grokClient: GrokClient;

    beforeEach(() => {
      grokClient = new GrokClient('test-key');
    });

    it('should generate content successfully with Grok API', async () => {
      const mockGrokResponse = {
        choices: [{
          message: {
            tool_calls: [{
              function: {
                arguments: JSON.stringify(mockNewsletterContent)
              }
            }]
          }
        }],
        usage: { total_tokens: 250 }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGrokResponse)
      });

      const result = await grokClient.generateContent(
        'System prompt',
        'User prompt',
        { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      );

      expect(result.content.subject).toBe(mockNewsletterContent.subject);
      expect(result.tokensUsed).toBe(250);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      );
    });

    it('should handle Grok API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(grokClient.generateContent(
        'System prompt',
        'User prompt',
        { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow('Grok API error: 500 Internal Server Error');
    });

    it('should handle malformed Grok API responses', async () => {
      const invalidResponse = {
        choices: [{ message: {} }] // Missing tool_calls
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse)
      });

      await expect(grokClient.generateContent(
        'System prompt',
        'User prompt',
        { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow('Invalid Grok API response structure');
    });

    it('should handle network timeouts', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network timeout'));

      await expect(grokClient.generateContent(
        'System prompt',
        'User prompt',
        { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow('Network timeout');
    });
  });

  describe('OpenAI Fallback Integration', () => {
    let openaiClient: OpenAIClient;

    beforeEach(() => {
      openaiClient = new OpenAIClient('test-openai-key');
    });

    it('should generate content successfully with OpenAI fallback', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: JSON.stringify(mockNewsletterContent)
          }
        }],
        usage: { total_tokens: 300 }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAIResponse)
      });

      const result = await openaiClient.generateContent(
        'System prompt',
        'User prompt',
        { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      );

      expect(result.content.subject).toBe(mockNewsletterContent.subject);
      expect(result.content.modelUsed).toBe('gpt-4o-fallback');
      expect(result.tokensUsed).toBe(300);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-openai-key'
          })
        })
      );
    });

    it('should handle OpenAI JSON parsing errors', async () => {
      const mockOpenAIResponse = {
        choices: [{
          message: {
            content: 'Invalid JSON content'
          }
        }],
        usage: { total_tokens: 300 }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockOpenAIResponse)
      });

      await expect(openaiClient.generateContent(
        'System prompt',
        'User prompt',
        { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow('Failed to parse OpenAI JSON response');
    });
  });

  describe('Content Caching', () => {
    it('should return cached content when available', async () => {
      const cachedContent = {
        ...mockNewsletterContent,
        generatedAt: new Date().toISOString(),
        modelUsed: 'grok-3-mini',
        tokenCount: 150,
        perspective: 'calm' as const,
        tier: 'basic' as const
      };

      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(JSON.stringify(cachedContent));

      const result = await service.generateContent(mockUser, mockEphemeris);

      expect(result).toEqual(cachedContent);
      expect(mockEnv.KV_CONTENT.get).toHaveBeenCalledWith('content:calm:basic:2024-01-20');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should cache generated content', async () => {
      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null); // No cache

      const mockGrokResponse = {
        choices: [{
          message: {
            tool_calls: [{
              function: {
                arguments: JSON.stringify(mockNewsletterContent)
              }
            }]
          }
        }],
        usage: { total_tokens: 250 }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGrokResponse)
      });

      await service.generateContent(mockUser, mockEphemeris);

      expect(mockEnv.KV_CONTENT.put).toHaveBeenCalledWith(
        'content:calm:basic:2024-01-20',
        expect.any(String),
        { expirationTtl: 48 * 60 * 60 }
      );
    });
  });

  describe('Failover Mechanism', () => {
    it('should failover to OpenAI when Grok fails', async () => {
      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null); // No cache

      // Mock Grok failure
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Grok API failure'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            choices: [{
              message: {
                content: JSON.stringify(mockNewsletterContent)
              }
            }],
            usage: { total_tokens: 300 }
          })
        });

      const result = await service.generateContent(mockUser, mockEphemeris);

      expect(result.modelUsed).toBe('gpt-4o-fallback');
      expect(global.fetch).toHaveBeenCalledTimes(2); // Grok then OpenAI
    });

    it('should use fallback content when both APIs fail', async () => {
      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null); // No cache

      // Mock both API failures
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Grok API failure'))
        .mockRejectedValueOnce(new Error('OpenAI API failure'));

      const result = await service.generateContent(mockUser, mockEphemeris);

      expect(result.modelUsed).toBe('fallback-content');
      expect(result.subject).toBe('Your Cosmic Moment'); // Calm perspective fallback
      expect(result.tokenCount).toBe(0);
    });
  });

  describe('Content Quality Validation', () => {
    it('should reject content that fails schema validation', async () => {
      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null);

      const invalidContent = {
        subject: 'x', // Too short
        sections: [] // Empty
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              tool_calls: [{
                function: {
                  arguments: JSON.stringify(invalidContent)
                }
              }]
            }
          }],
          usage: { total_tokens: 100 }
        })
      });

      const result = await service.generateContent(mockUser, mockEphemeris);

      // Should return fallback content due to validation failure
      expect(result.modelUsed).toBe('fallback-content');
    });

    it('should filter profane content appropriately', async () => {
      const contentWithProfanity = {
        ...mockNewsletterContent,
        sections: [
          {
            id: "test",
            heading: "Test",
            html: "<p>This contains badword1 in the content.</p>",
            text: "This contains badword1 in the content."
          }
        ]
      };

      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              tool_calls: [{
                function: {
                  arguments: JSON.stringify(contentWithProfanity)
                }
              }]
            }
          }],
          usage: { total_tokens: 100 }
        })
      });

      const result = await service.generateContent(mockUser, mockEphemeris);

      // Should return fallback content due to profanity
      expect(result.modelUsed).toBe('fallback-content');
    });
  });

  describe('Cost Tracking', () => {
    it('should track generation metrics correctly', async () => {
      mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null);

      const mockGrokResponse = {
        choices: [{
          message: {
            tool_calls: [{
              function: {
                arguments: JSON.stringify(mockNewsletterContent)
              }
            }]
          }
        }],
        usage: { total_tokens: 500 }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGrokResponse)
      });

      await service.generateContent(mockUser, mockEphemeris);

      expect(mockEnv.KV_METRICS.put).toHaveBeenCalledWith(
        expect.stringContaining('generation_metrics'),
        expect.stringContaining('"tokensUsed":500'),
        { expirationTtl: 30 * 24 * 60 * 60 }
      );
    });
  });

  describe('Circuit Breaker', () => {
    it('should open circuit breaker after multiple failures', async () => {
      mockEnv.KV_CONTENT.get.mockResolvedValue(null);

      // Mock multiple failures
      (global.fetch as any).mockRejectedValue(new Error('API failure'));

      const grokClient = new GrokClient('test-key');

      // First three failures should work but record failures
      await expect(grokClient.generateContent(
        'test', 'test', { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow();

      await expect(grokClient.generateContent(
        'test', 'test', { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow();

      await expect(grokClient.generateContent(
        'test', 'test', { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow();

      // Fourth call should trigger circuit breaker
      await expect(grokClient.generateContent(
        'test', 'test', { model: 'grok-3-mini', temperature: 0.7, maxTokens: 400 }
      )).rejects.toThrow('LLM circuit breaker open for grok');
    });
  });

  describe('Different Perspectives', () => {
    it('should generate appropriate fallback content for each perspective', async () => {
      const perspectives: Array<'calm' | 'knowledge' | 'success' | 'evidence'> = 
        ['calm', 'knowledge', 'success', 'evidence'];

      for (const perspective of perspectives) {
        const userContext = { ...mockUser, perspective };
        mockEnv.KV_CONTENT.get.mockResolvedValueOnce(null);
        
        // Mock API failure to trigger fallback
        (global.fetch as any).mockRejectedValue(new Error('API failure'));

        const result = await service.generateContent(userContext, mockEphemeris);

        expect(result.perspective).toBe(perspective);
        expect(result.modelUsed).toBe('fallback-content');
        
        // Verify perspective-specific content
        switch (perspective) {
          case 'calm':
            expect(result.subject).toContain('Cosmic Moment');
            break;
          case 'knowledge':
            expect(result.subject).toContain('Learning');
            break;
          case 'success':
            expect(result.subject).toContain('Success');
            break;
          case 'evidence':
            expect(result.subject).toContain('Pattern');
            break;
        }
      }
    });
  });
}); 