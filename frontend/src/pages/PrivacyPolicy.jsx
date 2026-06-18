import React from 'react';
import SEO from '../components/SEO';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 text-slate-800 dark:text-slate-100">
      <SEO title="Privacy Policy | Arogya Raksha" />
      <h1 className="text-3xl font-black text-primary dark:text-secondary mb-6">Privacy Policy</h1>
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-2">1. Information We Collect</h2>
          <p>We collect information that you provide directly to us when using Arogya Raksha, such as account registration details, health queries, and location data (if permitted) for nearby hospital searches. We also securely interact with OpenFDA for medication queries.</p>
        </section>
        
        <section>
          <h2 className="text-xl font-bold mb-2">2. How We Use Information</h2>
          <p>Your information is used solely to provide and improve the Arogya Raksha services. This includes generating personalized AI health assessments, showing relevant medical information, and enabling emergency SOS features. We do not sell your personal data.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">3. Data Security</h2>
          <p>We employ industry-standard security measures, including Firebase Authentication, secure JWT tokens, and HTTPS encryption to protect your data. Your health queries processed by AI are anonymized and not used to train global public models without consent.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">4. Third-Party Services</h2>
          <p>We integrate with Google Firebase for authentication and OpenFDA for medication databases. Their use of data is governed by their respective privacy policies.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2">5. Contact Us</h2>
          <p>For any privacy-related concerns, please contact the developer at devendrasagar0988@gmail.com.</p>
        </section>
      </div>
    </div>
  );
}
