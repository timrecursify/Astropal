import { logger } from '@/lib/logger';
import type { Env } from '../index';

// Email template data interface
export interface EmailTemplateData {
  // User context
  userName: string;
  userEmail: string;
  perspective: string;
  tier: string;
  focusAreas: string[];
  
  // Content data
  subject?: string;
  preheader?: string;
  sections?: Array<{
    id: string;
    heading: string;
    html: string;
    text: string;
    cta?: {
      label: string;
      url: string;
    };
  }>;
  shareableSnippet?: string;
  
  // URLs and tokens
  accountUrl: string;
  changePerspectiveUrl: string;
  updatePreferencesUrl: string;
  unsubscribeUrl: string;
  upgradeUrl?: string;
  cancelUrl?: string;
  
  // Social sharing
  shareUrls?: {
    twitter: string;
    facebook: string;
    linkedin: string;
  };
  
  // Template-specific data
  date?: string;
  trialEndDate?: string;
  deliveryTime?: string;
  daysRemaining?: number;
  
  // Conditional flags
  isFreeTier?: boolean;
  isBasicTier?: boolean;
  isProTier?: boolean;
  isTrial?: boolean;
  
  // Billing-related data
  basicPaymentLink?: string;
  proPaymentLink?: string;
  basicPrice?: string;
  proPrice?: string;
  tierName?: string;
  oldTier?: string;
  upgradedFeatures?: string[];
  recoveryType?: string;
  urgency?: string;
  billingPortalLink?: string;
  message?: string;
}

// Template types
export type TemplateType = 
  | 'welcome'
  | 'daily-cosmic-pulse'
  | 'trial-ending'
  | 'weekly-summary'
  | 'monthly-report'
  | 'perspective-changed'
  | 'subscription-cancelled';

// Email rendering result
export interface RenderedEmail {
  html: string;
  text: string;
  subject: string;
  preheader: string;
}

// Simple Mustache-style template renderer
class MustacheRenderer {
  static render(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    // Replace simple variables {{variable}}
    rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] || '';
    });
    
    // Replace dot notation {{object.property}}
    rendered = rendered.replace(/\{\{(\w+)\.(\w+)\}\}/g, (_, obj, prop) => {
      return data[obj]?.[prop] || '';
    });
    
    // Replace triple braces {{{html}}} for unescaped content
    rendered = rendered.replace(/\{\{\{(\w+)\}\}\}/g, (_, key) => {
      return data[key] || '';
    });
    
    // Handle array iteration {{#sections}}...{{/sections}}
    rendered = rendered.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, innerTemplate) => {
      const arrayData = data[key];
      if (!Array.isArray(arrayData)) return '';
      
      return arrayData.map(item => {
        return MustacheRenderer.render(innerTemplate, { ...data, ...item });
      }).join('');
    });
    
    // Handle conditional sections {{#condition}}...{{/condition}}
    rendered = rendered.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, innerTemplate) => {
      const condition = data[key];
      if (!condition) return '';
      
      return MustacheRenderer.render(innerTemplate, data);
    });
    
    return rendered;
  }
}

// MJML to HTML converter (simplified for Cloudflare Workers)
class MJMLConverter {
  static async convertToHTML(mjmlContent: string): Promise<string> {
    // For now, we'll use a simplified conversion
    // In production, you would use the full MJML library or a service
    
    // Basic MJML to HTML conversion
    let html = mjmlContent;
    
    // Replace MJML structure with HTML
    html = html.replace(/<mjml[^>]*>/gi, '<html>');
    html = html.replace(/<\/mjml>/gi, '</html>');
    html = html.replace(/<mj-head[^>]*>/gi, '<head>');
    html = html.replace(/<\/mj-head>/gi, '</head>');
    html = html.replace(/<mj-body([^>]*)>/gi, '<body$1>');
    html = html.replace(/<\/mj-body>/gi, '</body>');
    html = html.replace(/<mj-section([^>]*)>/gi, '<div style="width: 100%; margin: 0 auto;"$1>');
    html = html.replace(/<\/mj-section>/gi, '</div>');
    html = html.replace(/<mj-column([^>]*)>/gi, '<div style="display: inline-block; vertical-align: top;"$1>');
    html = html.replace(/<\/mj-column>/gi, '</div>');
    html = html.replace(/<mj-text([^>]*)>/gi, '<div$1>');
    html = html.replace(/<\/mj-text>/gi, '</div>');
    html = html.replace(/<mj-button([^>]*)>/gi, '<a style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;"$1>');
    html = html.replace(/<\/mj-button>/gi, '</a>');
    html = html.replace(/<mj-divider([^>]*)>/gi, '<hr$1>');
    html = html.replace(/<mj-title[^>]*>(.*?)<\/mj-title>/gi, '<title>$1</title>');
    html = html.replace(/<mj-preview[^>]*>(.*?)<\/mj-preview>/gi, '<!-- Preview: $1 -->');
    html = html.replace(/<mj-attributes[^>]*>[\s\S]*?<\/mj-attributes>/gi, '');
    html = html.replace(/<mj-style[^>]*>[\s\S]*?<\/mj-style>/gi, '<style>$1</style>');
    html = html.replace(/<mj-social([^>]*)>/gi, '<div style="text-align: center;"$1>');
    html = html.replace(/<\/mj-social>/gi, '</div>');
    html = html.replace(/<mj-social-element([^>]*)>/gi, '<a$1>');
    html = html.replace(/<\/mj-social-element>/gi, '</a>');
    html = html.replace(/<mj-table>/gi, '<table style="width: 100%; border-collapse: collapse;">');
    html = html.replace(/<\/mj-table>/gi, '</table>');
    
    // Add basic responsive email styles
    html = html.replace('<head>', `<head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        table { border-collapse: collapse; }
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .column { width: 100% !important; display: block !important; }
        }
      </style>`);
    
    return html;
  }
  
  static extractTextContent(html: string): string {
    // Simple HTML to text extraction
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }
}

export class EmailRenderer {
  private env: Env;
  
  constructor(env: Env) {
    this.env = env;
  }
  
  async renderTemplate(templateType: TemplateType, data: EmailTemplateData): Promise<RenderedEmail> {
    const startTime = Date.now();
    
    logger.info('Email rendering started', {
      templateType,
      userEmail: data.userEmail,
      tier: data.tier,
      component: 'email-renderer'
    });
    
    try {
      // Load MJML template from R2 or fallback to local
      const mjmlTemplate = await this.loadTemplate(templateType);
      
      // Prepare template data with defaults
      const templateData = this.prepareTemplateData(data);
      
      // Render Mustache variables
      const renderedMJML = MustacheRenderer.render(mjmlTemplate, templateData);
      
      // Convert MJML to HTML
      const html = await MJMLConverter.convertToHTML(renderedMJML);
      
      // Extract text version
      const text = MJMLConverter.extractTextContent(html);
      
      // Extract subject and preheader
      const subject = this.extractSubject(html, data);
      const preheader = this.extractPreheader(html, data);
      
      const duration = Date.now() - startTime;
      
      logger.info('Email rendering completed', {
        templateType,
        duration,
        htmlSize: html.length,
        textSize: text.length,
        component: 'email-renderer'
      });
      
      return { html, text, subject, preheader };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Email rendering failed', {
        templateType,
        error: (error as Error).message,
        duration,
        component: 'email-renderer'
      });
      
      throw error;
    }
  }
  
  private async loadTemplate(templateType: TemplateType): Promise<string> {
    try {
      // Try to load from R2 first
      const templatePath = `${templateType}.mjml`;
      const r2Object = await this.env.R2_TEMPLATES?.get(templatePath);
      
      if (r2Object) {
        return await r2Object.text();
      }
      
      // Fallback to local templates
      return await this.loadLocalTemplate(templateType);
      
    } catch (error) {
      logger.warn('Failed to load template from R2, using fallback', {
        templateType,
        error: (error as Error).message,
        component: 'email-renderer'
      });
      
      return await this.loadLocalTemplate(templateType);
    }
  }
  
  private async loadLocalTemplate(templateType: TemplateType): Promise<string> {
    // In production, these would be stored in R2
    // For now, return basic templates
    
    const templates: Record<TemplateType, string> = {
      'welcome': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Welcome {{userName}}! Your Astropal journey begins.</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      'daily-cosmic-pulse': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>{{subject}}</mj-text>
                {{#sections}}
                <mj-text>{{heading}}: {{{html}}}</mj-text>
                {{/sections}}
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      'trial-ending': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Hi {{userName}}, your trial ends in {{daysRemaining}} days.</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      'weekly-summary': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Your weekly cosmic summary, {{userName}}.</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      'monthly-report': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Your monthly cosmic report, {{userName}}.</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      'perspective-changed': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Your perspective has been changed to {{perspective}}, {{userName}}.</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `,
      'subscription-cancelled': `
        <mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>Your Astropal subscription has been cancelled, {{userName}}.</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>
      `
    };
    
    return templates[templateType] || templates['daily-cosmic-pulse'];
  }
  
  private prepareTemplateData(data: EmailTemplateData): Record<string, any> {
    // Add computed fields and defaults
    return {
      ...data,
      date: data.date || new Date().toLocaleDateString(),
      isFreeTier: data.tier === 'free',
      isBasicTier: data.tier === 'basic',
      isProTier: data.tier === 'pro',
      isTrial: data.tier === 'trial',
      
      // Default URLs if not provided
      accountUrl: data.accountUrl || `https://astropal.com/account`,
      changePerspectiveUrl: data.changePerspectiveUrl || `https://astropal.com/perspective`,
      updatePreferencesUrl: data.updatePreferencesUrl || `https://astropal.com/preferences`,
      unsubscribeUrl: data.unsubscribeUrl || `https://astropal.com/unsubscribe`,
      
      // Social sharing URLs
      shareUrls: data.shareUrls || {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.shareableSnippet || '')}`,
        facebook: `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://astropal.com')}`,
        linkedin: `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://astropal.com')}`
      }
    };
  }
  
  private extractSubject(html: string, data: EmailTemplateData): string {
    // Extract from title tag or use provided subject
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    return data.subject || titleMatch?.[1] || 'Your Daily Cosmic Pulse';
  }
  
  private extractPreheader(html: string, data: EmailTemplateData): string {
    // Extract from preview comment or use provided preheader
    const previewMatch = html.match(/<!-- Preview: (.*?) -->/);
    return data.preheader || previewMatch?.[1] || 'Personalized cosmic insights await...';
  }
}

// Factory function for creating email renderer
export function createEmailRenderer(env: Env): EmailRenderer {
  return new EmailRenderer(env);
} 