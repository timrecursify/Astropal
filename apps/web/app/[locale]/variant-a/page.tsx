import VariantAPage from '../../../components/variants/VariantA';

export const runtime = 'edge';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export default function VariantA() {
  return <VariantAPage />;
}

export const metadata = {
  title: 'Astropal - Cosmic Calm | Mental Health Astrology',
  description: 'AI-powered astrology for your mental health. Daily cosmic calm and emotional weather forecasts.',
}; 