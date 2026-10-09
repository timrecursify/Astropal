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

## Lead Receiver Integration

Both variants submit form data server-side to the Black Bow lead receiver. To integrate:

1. **Set `LEAD_RECEIVER_URL` and `LEAD_RECEIVER_TOKEN` as server-side secrets**
2. **Use the shared form endpoint**:

```typescript
// Forms post to /api/submit-form; the Pages Function calls the lead receiver.
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
