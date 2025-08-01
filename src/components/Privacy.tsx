import React from 'react';
import { Star } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5" />
          <span className="font-mono text-sm">ASTROPAL</span>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs text-gray-500 font-mono mb-8">[ PRIVACY POLICY ]</div>
          <h1 className="text-4xl md:text-6xl font-light mb-12">Privacy Policy</h1>
          
          <div className="space-y-8 text-gray-300 leading-relaxed">
            <p className="text-sm text-gray-400">Effective Date: January 1, 2025</p>
            
            <section>
              <h2 className="text-xl font-medium text-white mb-4">Information We Collect</h2>
              <div className="space-y-3">
                <p><strong className="text-white">Personal Information:</strong> Name, email, birth date/time/location, time zone, relationship status, and cosmic practice preferences.</p>
                <p><strong className="text-white">Usage Data:</strong> IP address, device information, website analytics, email engagement metrics, and interaction patterns.</p>
                <p><strong className="text-white">Astronomical Data:</strong> NASA and Swiss Ephemeris data for accurate cosmic calculations.</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">How We Use Your Information</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Generate personalized astrological content using advanced algorithms</li>
                <li>Deliver daily cosmic guidance emails at your preferred time</li>
                <li>Process payments and manage subscriptions</li>
                <li>Improve our services and develop new features</li>
                <li>Provide customer support and service updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Information Sharing</h2>
              <p className="mb-3"><strong className="text-white">We do not sell your personal information.</strong></p>
              <p>Limited sharing includes service providers (email delivery, payment processing), legal requirements, and business transfers. All third parties are bound by strict confidentiality agreements.</p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Data Security & Retention</h2>
              <p className="mb-3">We use industry-standard encryption, secure cloud infrastructure, and regular security audits to protect your data.</p>
              <p><strong className="text-white">Retention:</strong> Account data while active plus 7 years, email content for 2 years, analytics anonymized after 1 year.</p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Your Rights</h2>
              <ul className="space-y-2 list-disc list-inside">
                <li>Access, update, or delete your personal information</li>
                <li>Download your data in portable format</li>
                <li>Opt-out of marketing communications</li>
                <li>Modify delivery preferences and content types</li>
                <li>GDPR and CCPA rights for eligible residents</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Cookies & Tracking</h2>
              <p>We use cookies for essential functionality, analytics, personalization, and security. You can manage preferences through browser settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Age Requirement</h2>
              <p>Our services are for users 18 years and older. We do not knowingly collect information from minors.</p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Policy Updates</h2>
              <p>We may update this policy periodically. Material changes will be communicated via email and website notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-medium text-white mb-4">Contact Us</h2>
              <p>
                For privacy questions or requests, contact us at{' '}
                <a href="mailto:support@astropal.io" className="text-gray-400 hover:text-white transition-colors">
                  support@astropal.io
                </a>
              </p>
            </section>
          </div>

          <div className="mt-16 text-center">
            <a 
              href="/"
              className="inline-block px-8 py-3 bg-white text-black hover:bg-gray-200 transition-colors font-medium"
            >
              RETURN HOME
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;