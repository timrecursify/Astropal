import { getShareCard } from '@/lib/api';

export async function generateStaticParams() {
  // For static export, we'll generate a few example share cards
  // In production, these would be generated dynamically
  return [
    { id: 'example' },
    { id: 'sample' },
    { id: 'demo' }
  ];
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    // This would typically return a 308 redirect to PNG
    const shareData = await getShareCard(params.id);
    
    return {
      openGraph: {
        images: [`/api/share/${params.id}/image`],
      },
      twitter: {
        card: 'summary_large_image',
        images: [`/api/share/${params.id}/image`],
      },
    };
  } catch (error) {
    return {
      title: 'Share Card',
    };
  }
}

export default function SharePage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Your share card is loading...</p>
      </div>
    </main>
  );
}