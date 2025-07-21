import dynamic from 'next/dynamic';
import { Suspense } from 'react';

export const runtime = 'edge';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' }
  ];
}

const PortalPageContent = dynamic(() => import('./PortalPageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
    </div>
  )
});

export default function PortalPage() {
  return <PortalPageContent />;
} 