import VariantBPage from '../../../components/variants/VariantB';

export const runtime = 'edge';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export default function VariantB() {
  return <VariantBPage />;
}

export const metadata = {
  title: 'Astropal - Know Before You Text | Relationship Astrology',
  description: 'AI analyzes your charts for friendship & dating compatibility. Stop guessing, start knowing.',
}; 