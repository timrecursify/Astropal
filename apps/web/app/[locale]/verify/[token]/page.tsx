import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  // For static export, we'll generate a few example verification tokens
  // In production, these would be generated dynamically
  return [
    { token: 'example' },
    { token: 'sample' },
    { token: 'demo' }
  ];
}

export default function VerifyPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Verifying your token...</p>
        <p className="text-sm text-gray-500 mt-4">Token: {params.token}</p>
      </div>
    </div>
  );
}