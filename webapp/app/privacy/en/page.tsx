import Link from "next/link";
import type { Metadata } from "next";
import { LegalContactBox, LegalPage, LegalSection } from "@/components/common/LegalPage";
import { LEGAL_UPDATED_AT } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | FeedsToBook",
  description: "Privacy Policy for FeedsToBook.",
};

export default function EnglishPrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description='This Privacy Policy explains how FeedsToBook ("we", "our", or "us") collects, uses, discloses, and safeguards your information when you use our service.'
      updatedAt={LEGAL_UPDATED_AT}
      backHref="/"
      backLabel="Back to Home"
      categoryLabel="Official Policy"
      updatedAtPrefix="Effective Date: "
    >
      <LegalSection title="1. Introduction">
        <p>
          FeedsToBook Project Operations (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;)
          respects your privacy and is committed to protecting your personal information. This
          Privacy Policy explains how we collect, use, disclose, and safeguard your information when
          you use our service FeedsToBook (the &quot;Service&quot;).
        </p>
        <p>
          This Privacy Policy applies to all users worldwide and includes specific disclosures for
          residents of Japan, the European Economic Area (EEA), the United Kingdom (UK), and the
          State of California (USA).
        </p>
      </LegalSection>

      <LegalSection title="2. Information We Collect">
        <p>
          We collect personal information that you provide directly to us, information collected
          automatically, and information from third parties:
        </p>
        <ul>
          <li>
            <strong>Account &amp; Identification Data:</strong> Instagram user ID, username, and
            public profile identifiers required to authenticate your account.
          </li>
          <li>
            <strong>Instagram Post Content:</strong> Photographs, captions, post timestamps, and
            permalink URLs retrieved via the Instagram Graph API strictly for generating e-books
            requested by you.
          </li>
          <li>
            <strong>Session &amp; Technical Data:</strong> Encrypted authentication session cookies,
            access timestamps, and browser user-agent information necessary to maintain your session
            and secure the Service.
          </li>
          <li>
            <strong>Support &amp; Inquiries:</strong> Any email address, name, or message content
            you voluntarily submit when contacting us via our support form.
          </li>
        </ul>
        <p className="text-xs text-slate-500">
          * Note on Payment Data: FeedsToBook is currently provided free of charge. We do not
          collect, process, or store credit card details or payment transactions.
        </p>
      </LegalSection>

      <LegalSection title="3. How We Use Your Information (Purposes & Legal Bases)">
        <p>
          We process your personal information for specific purposes. Where the General Data
          Protection Regulation (GDPR) applies, we rely on the following legal bases:
        </p>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-left text-xs sm:text-sm border border-slate-200 rounded-lg">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-2.5 sm:p-3 font-semibold">Purpose of Processing</th>
                <th className="p-2.5 sm:p-3 font-semibold">Categories of Data</th>
                <th className="p-2.5 sm:p-3 font-semibold">Legal Basis under GDPR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-600">
              <tr>
                <td className="p-2.5 sm:p-3">
                  To retrieve user posts and generate/download requested e-books
                </td>
                <td className="p-2.5 sm:p-3">Post Content, Account Data</td>
                <td className="p-2.5 sm:p-3">Performance of Contract (Art. 6(1)(b))</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">
                  To maintain authenticated sessions and provide core service functionality
                </td>
                <td className="p-2.5 sm:p-3">Account Data, Session Cookies</td>
                <td className="p-2.5 sm:p-3">Performance of Contract (Art. 6(1)(b))</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">
                  To prevent unauthorized use, ensure system security, and handle operational issues
                </td>
                <td className="p-2.5 sm:p-3">Technical Logs, Account Data</td>
                <td className="p-2.5 sm:p-3">Legitimate Interests (Art. 6(1)(f))</td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">To respond to user inquiries and support requests</td>
                <td className="p-2.5 sm:p-3">Support &amp; Inquiries Data</td>
                <td className="p-2.5 sm:p-3">
                  Legitimate Interests (Art. 6(1)(f)) / Consent (Art. 6(1)(a))
                </td>
              </tr>
              <tr>
                <td className="p-2.5 sm:p-3">To comply with applicable legal obligations</td>
                <td className="p-2.5 sm:p-3">All relevant data categories</td>
                <td className="p-2.5 sm:p-3">Legal Obligation (Art. 6(1)(c))</td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="4. Cookies, Analytics, and External Transmissions">
        <p>
          We use strictly necessary cookies to manage user authentication and ensure system
          security. We do not use third-party advertising cookies or cross-site tracking
          technologies.
        </p>
        <p>
          <strong>Disclosure of External Transmissions:</strong> In accordance with applicable
          telecommunications and privacy regulations, we transmit essential data to the following
          external service providers to operate the Service:
        </p>
        <ul>
          <li>
            <strong>Meta Platforms, Inc. (Instagram Graph API):</strong> Used for account
            authentication and fetching user posts for e-book generation. Data transmitted: User
            OAuth access tokens, Instagram User ID.
          </li>
          <li>
            <strong>Google LLC (Google Forms):</strong> Used to host our user support and inquiry
            channel. Data transmitted: Information submitted directly by the user in the form.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Sharing and Disclosure of Information">
        <p>
          We do not sell, rent, or trade your personal data. We do not share personal information
          with third parties for advertising purposes.
        </p>
        <p>We only share personal information under the following limited circumstances:</p>
        <ul>
          <li>
            <strong>Platform Integration:</strong> Meta Platforms, Inc. for Instagram OAuth
            authentication and Graph API operations.
          </li>
          <li>
            <strong>Infrastructure Service Providers:</strong> Trusted cloud hosting providers
            operating under strict confidentiality and data protection terms.
          </li>
          <li>
            <strong>Legal Compliance:</strong> When required by applicable laws, court orders, or
            valid government requests.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="6. International Data Transfers">
        <p>
          Your information may be transferred to and processed in Japan, the United States, and
          other jurisdictions where our infrastructure providers and Meta Platforms, Inc. maintain
          servers.
        </p>
        <p>
          For EEA and UK Users: When transferring personal data outside the EEA or the UK, we rely
          on the European Commission&apos;s adequacy decisions (including the adequacy decision for
          Japan) or European Commission-approved Standard Contractual Clauses (SCCs).
        </p>
      </LegalSection>

      <LegalSection title="7. Data Retention & Stateless Architecture">
        <p>
          FeedsToBook is built with privacy-by-design principles, operating on a stateless
          processing model:
        </p>
        <ul>
          <li>
            <strong>Instagram Posts &amp; Generated E-books:</strong> Your Instagram post data and
            the generated e-books are processed ephemerally in memory during your active request. We
            do not permanently store post content or generated books on our servers.
          </li>
          <li>
            <strong>Session Information:</strong> Encrypted authentication session cookies are
            invalidated and deleted upon explicit logout, browser cookie clearance, or session
            expiration.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Specific Rights by Jurisdiction">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
              A. For Residents of the European Economic Area (EEA) and the UK (GDPR)
            </h3>
            <p>
              Under the GDPR, you have the right to access, rectify, erase (&quot;right to be
              forgotten&quot;), restrict processing, request data portability, and object to the
              processing of your personal data, as well as the right to lodge a complaint with your
              local Data Protection Authority (DPA). Because we operate statelessly and do not
              persist your post content on our servers, no persistent personal archives are
              retained, but we will fulfill any legitimate requests promptly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
              B. For California Residents (CCPA / CPRA)
            </h3>
            <p>
              In the preceding 12 months, we have collected identifiers (Instagram user ID,
              username) and internet/electronic network activity (technical logs). We do not sell
              personal information, nor do we share personal information for cross-context
              behavioral advertising. You have the right to know/access, delete, and correct your
              personal information, and the right to non-discrimination for exercising your CCPA
              rights. We also honor recognized opt-out preference signals, including the Global
              Privacy Control (GPC).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base mb-1">
              C. For Residents of Japan (Act on the Protection of Personal Information - APPI)
            </h3>
            <p>
              Pursuant to Japan&apos;s APPI, you have the right to request disclosure, correction,
              addition, deletion, suspension of use, erasure, or cessation of third-party provision
              of retained personal data.
            </p>
          </div>
        </div>
      </LegalSection>

      <LegalSection title="9. Security Measures">
        <p>
          We implement technical and organizational security measures to protect personal data,
          including:
        </p>
        <ul>
          <li>Enforced TLS/SSL encryption for all data in transit (HTTPS).</li>
          <li>
            Encrypted session cookies configured with HttpOnly, Secure, and SameSite protection.
          </li>
          <li>
            Stateless design minimizing data retention and reducing risk exposure to zero for stored
            post content.
          </li>
          <li>Routine vulnerability tracking and dependency security updates.</li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Children's Privacy">
        <p>
          The Service is not directed to children under 13 years of age (or 16 years of age in the
          EEA and California). We do not knowingly collect personal information from children under
          these ages.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes in legal
          requirements or operational practices. Any updates will take effect immediately upon being
          posted on this page with an updated &quot;Effective Date&quot;.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact Information">
        <p>
          If you have questions, comments, or requests regarding this Privacy Policy or your
          personal data, please contact us via our inquiry form:
        </p>
        <LegalContactBox
          title="FeedsToBook Contact Support"
          description="Please contact us via our Google Form. We typically respond within 3 business days."
          buttonLabel="Open Contact Form"
        />
        <p className="text-xs text-slate-500 mt-2">
          For instructions on disconnecting your Instagram account or deleting permissions, please
          see our <Link href="/data-deletion">Data Deletion Instructions</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
