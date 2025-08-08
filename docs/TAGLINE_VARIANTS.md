# Tagline A/B Testing Variants

This document tracks all tagline variants used in the A/B testing system across all page variants.

## Overview

The tagline A/B testing system randomly assigns one of 20 different tagline variants to each user session. The variant is consistent across all page visits within the same session and is tracked in form submissions sent to the Zapier webhook.

## Implementation Details

- **Total Variants**: 20 tagline variants across 10 categories
- **Session Storage Key**: `astropal_tagline_variant`
- **Tracking Field**: `tagline_variant` (sent to webhook)
- **Selection Method**: Hash-based consistent assignment per session

## Tagline Variants Table

| Variant ID | Category | Headline | Subheadline | Testing Notes |
|------------|----------|----------|-------------|---------------|
| **CUR-001** | Curiosity-Driven | What Did the Stars Plan for You Today? | Your personalized cosmic forecast, delivered fresh every morning | Question-based hook, daily anticipation, personal relevance |
| **CUR-002** | Curiosity-Driven | The Universe Has a Message for You | Don't miss what the cosmos revealed about your day | Urgency, FOMO, direct personal address |
| **CON-001** | Convenience/Routine | Your Daily Dose of Cosmic Clarity | 5 minutes. One email. Infinite possibilities. | Medical/supplement metaphor, time efficiency, brevity |
| **CON-002** | Convenience/Routine | Skip the Tarot Cards. Get Your Answers Here. | Modern cosmic guidance without the guesswork | Competitor comparison, convenience over traditional methods |
| **SCI-001** | Scientific/Credibility | NASA-Powered Astrology That Actually Works | Real space data meets ancient wisdom in your inbox | Authority, credibility, "real" vs "fake" astrology |
| **SCI-002** | Scientific/Credibility | Finally, Astrology with Actual Astronomy | Swiss precision meets cosmic insight, delivered daily | Quality differentiation, European luxury association |
| **TRA-001** | Transformation/Outcome | Stop Wondering. Start Knowing. | Daily cosmic intel that puts you ahead of the game | Confidence building, competitive advantage, certainty |
| **TRA-002** | Transformation/Outcome | Your Unfair Cosmic Advantage | While others guess, you'll know exactly when to act | Exclusivity, timing benefits, superiority |
| **MAS-001** | Mass Appeal/Broader Audience | Everyone's Talking About Their Daily Cosmic Brief | Join thousands getting their edge from the stars | Social proof, mainstream acceptance, FOMO |
| **MAS-002** | Mass Appeal/Broader Audience | The Newsletter Smart People Read Before Coffee | Strategic cosmic insights for the modern professional | Intelligence positioning, professional appeal, male targeting |
| **URG-001** | Urgency/Scarcity | Don't Navigate Today Blind | Your cosmic compass arrives at dawn | Problem awareness, daily necessity, guidance metaphor |
| **URG-002** | Urgency/Scarcity | Today's Cosmic Weather Report | Essential intel for navigating your day ahead | Weather metaphor, essential service positioning |
| **MYS-001** | Mystical/Magical | Your Personal Oracle, Delivered Daily | Ancient secrets, decoded for modern life | Oracle positioning, ancient wisdom appeal |
| **MYS-002** | Mystical/Magical | The Stars Whisper. We Translate. | Your daily dose of cosmic intelligence | Mystical communication, translation service |
| **LIF-001** | Lifestyle/Aspirational | Level Up Your Life with Cosmic Timing | Daily guidance for ambitious souls | Gaming terminology, ambition targeting, timing benefits |
| **LIF-002** | Lifestyle/Aspirational | The Cosmic Edge Every High Achiever Needs | Strategic astrology for people who get things done | Achievement-oriented, professional targeting, results focus |
| **SIM-001** | Simplicity/Accessibility | Astrology Made Simple. Results Made Real. | No crystal balls required – just real guidance | Simplification, accessibility, practical results |
| **SIM-002** | Simplicity/Accessibility | Cosmic Guidance for Normal People | Finally, astrology that makes sense and fits your life | Relatability, normalizing astrology, life integration |
| **COM-001** | Comparison/Alternative | Better Than Your Horoscope | Personalized cosmic intelligence vs generic predictions | Direct competitor comparison, personalization benefits |
| **COM-002** | Comparison/Alternative | This Isn't Your Newspaper Horoscope | Precision cosmic guidance powered by real space data | Quality differentiation, data credibility |

## Category Breakdown

- **Curiosity-Driven**: 2 variants (CUR-001, CUR-002)
- **Convenience/Routine**: 2 variants (CON-001, CON-002)
- **Scientific/Credibility**: 2 variants (SCI-001, SCI-002)
- **Transformation/Outcome**: 2 variants (TRA-001, TRA-002)
- **Mass Appeal/Broader Audience**: 2 variants (MAS-001, MAS-002)
- **Urgency/Scarcity**: 2 variants (URG-001, URG-002)
- **Mystical/Magical**: 2 variants (MYS-001, MYS-002)
- **Lifestyle/Aspirational**: 2 variants (LIF-001, LIF-002)
- **Simplicity/Accessibility**: 2 variants (SIM-001, SIM-002)
- **Comparison/Alternative**: 2 variants (COM-001, COM-002)

## Default Fallback

- **Variant ID**: DEFAULT
- **Headline**: "Unlock Your Cosmic Potential Every Morning"
- **Subheadline**: "Transform your life with personalized spiritual guidance that reveals your hidden strengths and perfect timing"
- **Usage**: Used when variant selection fails or for testing

## Implementation Files

### Core System
- `src/utils/taglineVariants.ts` - Main variant definitions and selection logic
- `src/hooks/useTaglineVariant.ts` - React hook for component integration
- `src/utils/visitorTracking.ts` - Visitor tracking with tagline variant data
- `functions/api/submit-form.ts` - Cloudflare function with variant data forwarding

### Page Integrations
- `src/components/variants/Variant0.tsx` - Landing page variant 0
- `src/components/variants/Variant1Hero.tsx` - Landing page variant 1 hero section
- `src/components/variants/Variant2Hero.tsx` - Landing page variant 2 hero section

## Webhook Data Format

When forms are submitted, the following tagline-related data is sent to the Zapier webhook:

```json
{
  "tagline_variant": "CUR-001",
  "variant": "variant1",
  "ab_test_variant": "variant1",
  "visitor_data": {
    "tagline_variant": "CUR-001",
    // ... other visitor data
  }
  // ... form data and other fields
}
```

## Testing and Development

### Reset Variant (for testing)
```javascript
// In browser console
import { resetTaglineVariant } from './src/utils/taglineVariants';
resetTaglineVariant();
```

### View Current Variant
Check the browser console or look for the variant ID displayed on the page (visible in development mode).

### Session Storage Keys
- `astropal_tagline_variant` - Current tagline variant ID
- `astropal_session_id` - Session ID used for consistent variant assignment

## Analytics Tracking

The tagline variant data is automatically included in:
1. **Form submissions** - Sent to Zapier webhook for analysis
2. **Visitor tracking** - Captured with all other session data
3. **Facebook Pixel events** - Available in custom parameters
4. **Session storage** - Persistent across page visits

## Notes

- Variants are assigned consistently per session using hash-based selection
- All variants are mobile-optimized and responsive
- The system gracefully falls back to the DEFAULT variant if any errors occur
- Variant IDs are visible in development mode for debugging purposes
- Each category tests different psychological triggers and value propositions