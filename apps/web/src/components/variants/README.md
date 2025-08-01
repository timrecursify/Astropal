# AB Testing Variants

This folder contains the AB testing variants for the Astropal.io landing page.

## Variants

### Variant 1 - Cosmic Wellness (/variant1)
- **Theme**: Mental health and wellness focus
- **Colors**: Purple and pink gradient scheme
- **Target Audience**: Users interested in mental wellness and self-care
- **Key Features**: 
  - "Your daily dose of cosmic wellness" messaging
  - Mental health insights and timing
  - Wellness-focused pricing plans

### Variant 2 - Relationship Intel (/variant2)  
- **Theme**: Relationship and compatibility focus
- **Colors**: Pink and purple gradient scheme
- **Target Audience**: Users interested in relationships and social connections
- **Key Features**:
  - "Your daily relationship intel" messaging
  - Compatibility insights and communication guides
  - Relationship-focused pricing plans

## Zapier Webhook Integration

Both variants are designed to submit form data to your Zapier webhook. To integrate:

1. **Set up your Zapier webhook URL**
2. **Update the webhook URL in the form handlers**:

```typescript
// In Variant1Hero.tsx and Variant2Hero.tsx, replace the commented webhook call:
await fetch('YOUR_ZAPIER_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

### Form Data Structure

Each variant sends the following data structure:

```typescript
{
  email: string,
  birthDate: string,
  birthLocation: string,
  variant: 'wellness' | 'relationship',
  abTestVariant: 'variant1' | 'variant2',
  timestamp: string,
  practices: string[],
  focus: string
}
```

### AB Testing Analytics

- `abTestVariant`: Identifies which variant the user saw
- `variant`: The theme/focus of the variant
- `practices` and `focus`: Additional context for segmentation

## Deployment Notes

- All variants use the same StarField background animation
- Forms are optimized for mobile with touch-friendly inputs
- Confirmation screens provide clear next steps
- No backend required - works with static hosting on Cloudflare Pages 