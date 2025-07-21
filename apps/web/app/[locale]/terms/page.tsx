import { useTranslations } from 'next-intl';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export default function TermsPage() {
  const t = useTranslations('ui.legal');

  return (
    <main className="min-h-screen bg-black text-white py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-white mb-8">{t('terms')}</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
            <p className="text-gray-300 leading-relaxed mb-6">
              {t('disclaimer')}
            </p>
            
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-xl text-white mb-4">1. Agreement to Terms</h2>
                <p className="leading-relaxed">
                  By accessing and using Astropal, you accept and agree to be bound by the terms and 
                  provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">2. Use License</h2>
                <p className="leading-relaxed mb-4">
                  Permission is granted to temporarily download one copy of Astropal's materials for personal, 
                  non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                </p>
                <p className="leading-relaxed">
                  Under this license you may not: modify or copy the materials; use the materials for any 
                  commercial purpose; attempt to reverse engineer any software; or remove any copyright 
                  or other proprietary notations.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">3. Disclaimer</h2>
                <p className="leading-relaxed">
                  The materials on Astropal are provided on an 'as is' basis. Astropal makes no warranties, 
                  expressed or implied, and hereby disclaims and negates all other warranties including without 
                  limitation, implied warranties or conditions of merchantability, fitness for a particular 
                  purpose, or non-infringement of intellectual property or other violation of rights.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">4. Astrological Content</h2>
                <p className="leading-relaxed">
                  All astrological content provided by Astropal is for entertainment and self-reflection 
                  purposes only. This content should not be used as a substitute for professional advice 
                  in areas including but not limited to: health, legal, financial, or relationship decisions.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">5. Subscription Services</h2>
                <p className="leading-relaxed">
                  Paid subscriptions are billed monthly or annually as selected. You may cancel your 
                  subscription at any time through the unsubscribe link in any email. Cancellations 
                  take effect at the end of the current billing period.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">6. Privacy</h2>
                <p className="leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs 
                  your use of the Service, to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">7. Governing Law</h2>
                <p className="leading-relaxed">
                  These terms and conditions are governed by and construed in accordance with the laws 
                  of the United States and you irrevocably submit to the exclusive jurisdiction of the 
                  courts in that state or location.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Last updated: January 20, 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                If you have any questions about these Terms of Service, please contact us at legal@astropal.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}