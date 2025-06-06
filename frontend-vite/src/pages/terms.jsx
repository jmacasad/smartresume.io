import React from 'react';

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Terms and Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Effective Date: [Insert Launch Date] | Last Updated: [Insert Last Updated Date]</p>

      <p className="mb-4">
        Welcome to <strong>Resume.io</strong>, a service provided by <strong>Noskilzz Pty Ltd</strong> (“Noskilzz”, “we”, “us”, or “our”). These Terms and Conditions ("Terms") govern your access to and use of the Resume.io web application (the “Service”).
      </p>
      <p className="mb-4">
        By creating an account, accessing, or using Resume.io, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">1. Use of the Service</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>You must be 18 years or older to use Resume.io.</li>
        <li>You agree to use Resume.io only for lawful purposes and in compliance with all applicable laws.</li>
        <li>You are responsible for maintaining the confidentiality of your account credentials and activities.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">2. User Content</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>You retain ownership of your uploaded resumes, job descriptions, and related content.</li>
        <li>By submitting content, you grant Noskilzz a non-exclusive, royalty-free license to process your content solely to deliver the requested services.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">3. Account & Data</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>You are responsible for the accuracy of the information you provide.</li>
        <li>We reserve the right to suspend or delete accounts that violate these Terms or are inactive for prolonged periods.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">4. Plans & Billing</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>Free and paid subscription plans may be offered.</li>
        <li>Paid plans are subject to the terms listed on the pricing page and processed through Stripe.</li>
        <li>Refunds are not guaranteed and are issued at our discretion, subject to Stripe’s refund policies.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">5. Privacy & Security</h2>
      <ul className="list-disc pl-6 mb-4">
        <li>We are committed to protecting your privacy. Please refer to our Privacy Policy for more information.</li>
        <li>Uploaded files are stored securely and encrypted.</li>
        <li>You may request deletion of your data and account at any time by contacting support.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">6. Intellectual Property</h2>
      <p className="mb-4">
        Resume.io and its content (excluding user content) are owned by Noskilzz and protected by copyright and intellectual property laws. You may not duplicate, modify, or redistribute any part of Resume.io without our permission.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">7. Service Availability</h2>
      <p className="mb-4">
        We aim to provide reliable service but do not guarantee uninterrupted access. We may update, suspend, or terminate parts or all of the service at any time without notice.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">8. Limitation of Liability</h2>
      <p className="mb-4">
        Resume.io is provided “as is.” Noskilzz makes no warranties, expressed or implied. To the fullest extent permitted by law, we are not liable for any damages, data loss, or business interruption resulting from your use of Resume.io.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">9. Changes to Terms</h2>
      <p className="mb-4">
        We may update these Terms periodically. Users will be notified of significant changes. Continued use of the Service after changes constitutes acceptance of the updated Terms.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">10. Contact Us</h2>
      <p className="mb-4">
        If you have questions about these Terms, contact us at:<br/>
        📧 <strong>support@noskilzz.com</strong>
      </p>
    </div>
  );
}
