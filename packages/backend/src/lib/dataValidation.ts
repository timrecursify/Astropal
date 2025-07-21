import { z } from 'zod';
import { logger } from './logger';

// Ephemeris data validation schemas
export const CelestialBodySchema = z.object({
  longitude: z.number().min(0).max(360),
  latitude: z.number().min(-90).max(90),
  distance: z.number().positive(),
  speed: z.number(),
  retrograde: z.boolean()
});

export const AspectSchema = z.object({
  body1: z.string().min(1),
  body2: z.string().min(1),
  aspect: z.enum(['conjunction', 'opposition', 'trine', 'square', 'sextile', 'quincunx']),
  orb: z.number().min(0).max(10),
  exact: z.boolean()
});

export const EphemerisDataSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bodies: z.record(z.string(), CelestialBodySchema),
  aspects: z.array(AspectSchema)
});

// News article validation schema
export const NewsArticleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(10).max(200),
  description: z.string().min(20).max(500).optional(),
  url: z.string().url(),
  source: z.object({
    name: z.string().min(1)
  }).optional(),
  publishedAt: z.string().optional(),
  urlToImage: z.string().url().optional(),
  content: z.string().optional()
});

export const NewsResponseSchema = z.object({
  status: z.literal('ok'),
  totalResults: z.number().min(0),
  articles: z.array(NewsArticleSchema)
});

// Data quality validation functions
export class DataValidator {
  
  static validateEphemerisData(data: unknown): { isValid: boolean; data?: any; errors?: string[] } {
    const result = EphemerisDataSchema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('Ephemeris data validation failed', {
        errors,
        component: 'data-validator'
      });
      
      return { isValid: false, errors };
    }
    
    // Additional quality checks
    const qualityErrors: string[] = [];
    const ephemerisData = result.data;
    
    // Check for minimum required celestial bodies
    const requiredBodies = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const missingBodies = requiredBodies.filter(body => !(body in ephemerisData.bodies));
    
    if (missingBodies.length > 0) {
      qualityErrors.push(`Missing required celestial bodies: ${missingBodies.join(', ')}`);
    }
    
    // Check for reasonable date (not too far in past/future)
    const dataDate = new Date(ephemerisData.date);
    const now = new Date();
    const daysDiff = Math.abs((dataDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 365) {
      qualityErrors.push('Ephemeris date is more than 1 year from current date');
    }
    
    // Check planetary positions for basic sanity
    Object.entries(ephemerisData.bodies).forEach(([body, data]) => {
      if (body === 'sun' && Math.abs(data.latitude) > 1) {
        qualityErrors.push('Sun latitude seems incorrect (should be near 0)');
      }
      
      if (body === 'moon' && data.distance > 0.01) {
        qualityErrors.push('Moon distance seems incorrect (should be < 0.01 AU)');
      }
    });
    
    if (qualityErrors.length > 0) {
      logger.warn('Ephemeris data quality issues detected', {
        errors: qualityErrors,
        component: 'data-validator'
      });
      
      return { isValid: false, errors: qualityErrors };
    }
    
    logger.info('Ephemeris data validation passed', {
      date: ephemerisData.date,
      bodyCount: Object.keys(ephemerisData.bodies).length,
      aspectCount: ephemerisData.aspects.length,
      component: 'data-validator'
    });
    
    return { isValid: true, data: ephemerisData };
  }
  
  static validateNewsData(data: unknown): { isValid: boolean; data?: any; errors?: string[] } {
    const result = NewsResponseSchema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      
      logger.warn('News data validation failed', {
        errors,
        component: 'data-validator'
      });
      
      return { isValid: false, errors };
    }
    
    const newsData = result.data;
    const qualityErrors: string[] = [];
    
    // Check for minimum article count
    if (newsData.articles.length < 5) {
      qualityErrors.push('Insufficient number of articles (minimum 5 required)');
    }
    
    // Check for content quality
    const lowQualityArticles = newsData.articles.filter(article => {
      // Check for very short descriptions
      if (article.description && article.description.length < 50) return true;
      
      // Check for broken or suspicious URLs
      if (article.url.includes('localhost') || article.url.includes('127.0.0.1')) return true;
      
      // Check for missing source information
      if (!article.source?.name) return true;
      
      return false;
    });
    
    if (lowQualityArticles.length > newsData.articles.length * 0.3) {
      qualityErrors.push('More than 30% of articles have quality issues');
    }
    
    // Check for duplicate articles
    const uniqueUrls = new Set(newsData.articles.map(a => a.url));
    if (uniqueUrls.size !== newsData.articles.length) {
      qualityErrors.push('Duplicate articles detected');
    }
    
    // Check for relevance keywords (basic)
    const astrologyKeywords = ['astrology', 'horoscope', 'zodiac', 'celestial', 'planetary', 'cosmic'];
    const scienceKeywords = ['science', 'technology', 'research', 'study', 'discovery'];
    const businessKeywords = ['business', 'economy', 'market', 'finance', 'company'];
    
    const categorizedArticles = newsData.articles.filter(article => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      return astrologyKeywords.some(keyword => text.includes(keyword)) ||
             scienceKeywords.some(keyword => text.includes(keyword)) ||
             businessKeywords.some(keyword => text.includes(keyword));
    });
    
    if (categorizedArticles.length < newsData.articles.length * 0.7) {
      qualityErrors.push('Less than 70% of articles contain relevant keywords');
    }
    
    if (qualityErrors.length > 0) {
      logger.warn('News data quality issues detected', {
        errors: qualityErrors,
        articleCount: newsData.articles.length,
        component: 'data-validator'
      });
      
      return { isValid: false, errors: qualityErrors };
    }
    
    logger.info('News data validation passed', {
      articleCount: newsData.articles.length,
      totalResults: newsData.totalResults,
      component: 'data-validator'
    });
    
    return { isValid: true, data: newsData };
  }
  
  static calculateDataFreshness(fetchedAt: string, maxAgeHours: number = 24): boolean {
    const fetchDate = new Date(fetchedAt);
    const now = new Date();
    const ageHours = (now.getTime() - fetchDate.getTime()) / (1000 * 60 * 60);
    
    const isFresh = ageHours <= maxAgeHours;
    
    logger.debug('Data freshness check', {
      fetchedAt,
      ageHours: Math.round(ageHours * 100) / 100,
      maxAgeHours,
      isFresh,
      component: 'data-validator'
    });
    
    return isFresh;
  }
  
  static filterProfaneContent(text: string): string {
    // Comprehensive profanity filter for newsletter content
    const profanityWords = [
      // Common inappropriate words for professional content
      'damn', 'hell', 'crap', 'suck', 'sucks', 'stupid', 'idiot',
      'hate', 'kill', 'murder', 'die', 'death', 'suicide', 'bomb',
      'terror', 'violence', 'drug', 'drugs', 'addiction', 'abuse',
      // Political and controversial terms to avoid
      'politics', 'political', 'election', 'vote', 'democrat', 'republican',
      'liberal', 'conservative', 'trump', 'biden', 'government', 'conspiracy',
      // Financial advice disclaimers
      'investment advice', 'financial advice', 'guarantee', 'guaranteed returns',
      'get rich quick', 'easy money', 'risk free', 'insider trading',
      // Medical disclaimers
      'medical advice', 'diagnose', 'treatment', 'cure', 'miracle cure',
      'prescription', 'medicine', 'supplement', 'therapy'
    ];
    
    let filteredText = text;
    let hasFilteredContent = false;
    
    profanityWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(filteredText)) {
        hasFilteredContent = true;
        filteredText = filteredText.replace(regex, '*'.repeat(word.length));
      }
    });
    
    // Log if content was filtered for monitoring
    if (hasFilteredContent) {
      logger.info('Content filtered for inappropriate language', {
        originalLength: text.length,
        filteredLength: filteredText.length,
        component: 'content-validation'
      });
    }
    
    return filteredText;
  }
  
  static detectDuplicateContent(newContent: string, existingContent: string[]): boolean {
    // Simple similarity check - in production would use more sophisticated algorithm
    const similarity = existingContent.find(existing => {
      const newWords = newContent.toLowerCase().split(' ');
      const existingWords = existing.toLowerCase().split(' ');
      
      const commonWords = newWords.filter(word => 
        word.length > 4 && existingWords.includes(word)
      );
      
      const similarityRatio = commonWords.length / Math.max(newWords.length, existingWords.length);
      return similarityRatio > 0.7; // 70% similarity threshold
    });
    
    const isDuplicate = !!similarity;
    
    if (isDuplicate) {
      logger.warn('Duplicate content detected', {
        contentPreview: newContent.substring(0, 100),
        component: 'data-validator'
      });
    }
    
    return isDuplicate;
  }
  
  static validateAstronomicalAccuracy(ephemerisData: any): { isAccurate: boolean; warnings?: string[] } {
    const warnings: string[] = [];
    
    // Basic astronomical sanity checks
    const bodies = ephemerisData.bodies;
    
    // Sun should always be near ecliptic (latitude ~0)
    if (bodies.sun && Math.abs(bodies.sun.latitude) > 1) {
      warnings.push('Sun latitude deviates significantly from ecliptic');
    }
    
    // Moon distance should be reasonable (0.0024 - 0.0027 AU)
    if (bodies.moon && (bodies.moon.distance < 0.002 || bodies.moon.distance > 0.003)) {
      warnings.push('Moon distance outside expected range');
    }
    
    // Inner planets should not be more than certain angles from Sun
    const innerPlanets = ['mercury', 'venus'];
    innerPlanets.forEach(planet => {
      if (bodies[planet] && bodies.sun) {
        const angularSeparation = Math.abs(bodies[planet].longitude - bodies.sun.longitude);
        const minSeparation = Math.min(angularSeparation, 360 - angularSeparation);
        
        if (planet === 'mercury' && minSeparation > 28) {
          warnings.push('Mercury too far from Sun (max elongation ~28°)');
        }
        
        if (planet === 'venus' && minSeparation > 48) {
          warnings.push('Venus too far from Sun (max elongation ~48°)');
        }
      }
    });
    
    // Check for retrograde motion reasonableness
    Object.entries(bodies).forEach(([planet, data]: [string, any]) => {
      if (planet !== 'sun' && planet !== 'moon') {
        // Outer planets are retrograde more often
        const isOuterPlanet = ['mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].includes(planet);
        
        if (data.retrograde && !isOuterPlanet) {
          // Inner planets retrograde less often
          warnings.push(`${planet} marked as retrograde (less common for inner planets)`);
        }
      }
    });
    
    const isAccurate = warnings.length === 0;
    
    if (!isAccurate) {
      logger.warn('Astronomical accuracy warnings', {
        warnings,
        date: ephemerisData.date,
        component: 'data-validator'
      });
    }
    
    return { isAccurate, warnings: warnings.length > 0 ? warnings : undefined };
  }
}

// Export schemas for external use
export type EphemerisData = z.infer<typeof EphemerisDataSchema>;
export type NewsArticle = z.infer<typeof NewsArticleSchema>;
export type NewsResponse = z.infer<typeof NewsResponseSchema>; 