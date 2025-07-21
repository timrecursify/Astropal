import { useTranslations } from 'next-intl';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' }
  ];
}

export default function PrivacyPage() {
  const t = useTranslations('ui.legal');

  return (
    <main className="min-h-screen bg-black text-white py-32 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-white mb-8">{t('privacy')}</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-900/50 rounded-xl p-8 border border-gray-800">
            <p className="text-gray-300 leading-relaxed mb-6">
              {t('disclaimer')}
            </p>
            
            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-xl text-white mb-4">1. Information We Collect</h2>
                <p className="leading-relaxed mb-4">
                  We collect information you provide directly to us, such as when you create an account, 
                  subscribe to our service, or contact us for support.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email address</li>
                  <li>Birth date, time, and location (for astrological calculations)</li>
                  <li>Timezone and locale preferences</li>
                  <li>Selected perspective and focus areas</li>
                  <li>Payment information (processed securely through Stripe)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">2. How We Use Your Information</h2>
                <p className="leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Generate personalized astrological content based on your birth chart</li>
                  <li>Send you newsletters and updates according to your subscription</li>
                  <li>Process payments and manage your account</li>
                  <li>Improve our services and develop new features</li>
                  <li>Communicate with you about your account or our services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">3. Information Sharing</h2>
                <p className="leading-relaxed">
                  We do not sell, trade, or rent your personal information to third parties. We may share 
                  your information only in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>With service providers who help us operate our business (like Stripe for payments and Resend for emails)</li>
                  <li>To comply with legal obligations or protect our rights</li>
                  <li>In connection with a business transaction like a merger or acquisition</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">4. Data Security</h2>
                <p className="leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction. Your 
                  payment information is processed securely through Stripe and we do not store payment details.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">5. Your Rights (GDPR)</h2>
                <p className="leading-relaxed mb-4">
                  If you are in the European Union, you have the following rights:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong>Right to Portability:</strong> Request transfer of your data</li>
                  <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
                </ul>
                <p className="leading-relaxed mt-4">
                  To exercise these rights, contact us at privacy@astropal.com or use the links provided in your emails.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">6. Data Retention</h2>
                <p className="leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services and 
                  fulfill the purposes outlined in this privacy policy. Inactive accounts are automatically 
                  deleted after 24 months of inactivity.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">7. Cookies and Tracking</h2>
                <p className="leading-relaxed">
                  We use minimal tracking technologies to improve your experience. We may use:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Essential cookies for website functionality</li>
                  <li>Analytics to understand how our service is used</li>
                  <li>Email tracking to measure engagement (you can opt out)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">8. Children's Privacy</h2>
                <p className="leading-relaxed">
                  Our service is not intended for children under 13 years of age. We do not knowingly 
                  collect personal information from children under 13. If you are under 13, please do not 
                  provide any information to us.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">9. International Transfers</h2>
                <p className="leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your data in accordance with 
                  this privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl text-white mb-4">10. Changes to This Policy</h2>
                <p className="leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of any changes 
                  by posting the new privacy policy on this page and updating the "Last updated" date.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-700">
              <p className="text-sm text-gray-500">
                Last updated: January 20, 2025
              </p>
              <p className="text-sm text-gray-500 mt-2">
                If you have any questions about this Privacy Policy, please contact us at privacy@astropal.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}