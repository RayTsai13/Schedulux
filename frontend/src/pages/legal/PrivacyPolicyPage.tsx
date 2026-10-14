import LegalPageLayout, { legalList, legalText, type LegalSection } from './LegalPageLayout';

// NOTE: Placeholder policy text describing how the app currently handles data.
// Have it reviewed by a qualified lawyer before relying on it.

const sections: LegalSection[] = [
  {
    heading: 'Information We Collect',
    body: (
      <>
        <p className={legalText}>We collect the information you give us when you use Schedulux:</p>
        <ul className={legalList}>
          <li><strong>Vendor accounts:</strong> your name, email address, optional phone number, timezone, and a securely hashed password.</li>
          <li><strong>Vendor pages:</strong> page name, handle, bio, address or city, photos you upload, and social handles you choose to display.</li>
          <li><strong>Bookings:</strong> the name, email, and optional phone number a guest enters when booking, the appointment time and status, and any notes added.</li>
          <li><strong>Waitlists:</strong> the name and email you leave when joining a sold-out drop's waitlist.</li>
        </ul>
        <p className={legalText}>
          Guests don't create accounts. Each booking has a private link, sent by email, that lets whoever holds it
          view, reschedule, or cancel that booking.
        </p>
      </>
    ),
  },
  {
    heading: 'How We Use Your Information',
    body: (
      <ul className={legalList}>
        <li>Create and secure vendor accounts and keep vendors signed in.</li>
        <li>Show vendor pages and availability, and process bookings, reschedules, and cancellations.</li>
        <li>Send transactional emails: welcome messages, booking confirmations, status changes, and password resets.</li>
        <li>Prevent abuse, such as rate limiting repeated login attempts.</li>
        <li>Maintain, debug, and improve the service.</li>
      </ul>
    ),
  },
  {
    heading: 'What Vendors and Clients See',
    body: (
      <p className={legalText}>
        When you book an appointment, the vendor receives the details needed to provide the service, including your
        name, the appointment time, your notes, and your address if the service is performed at your location.
        Vendor page information (name, bio, services, drops) is public at the vendor's link.
      </p>
    ),
  },
  {
    heading: 'Service Providers',
    body: (
      <>
        <p className={legalText}>We share data only with the providers that run parts of the service for us:</p>
        <ul className={legalList}>
          <li><strong>Amazon Web Services:</strong> application hosting and database storage.</li>
          <li><strong>SendGrid:</strong> delivery of transactional email.</li>
          <li><strong>Cloudinary:</strong> storage and delivery of images vendors upload.</li>
          <li><strong>Google Fonts:</strong> font files loaded by your browser.</li>
        </ul>
        <p className={legalText}>
          We do not sell your personal information. We may disclose information if required by law or as part of a
          merger or sale of the business.
        </p>
      </>
    ),
  },
  {
    heading: 'Data Security and Retention',
    body: (
      <p className={legalText}>
        Passwords are hashed and never stored in plain text, and traffic is encrypted over HTTPS. Deleted
        storefronts, services, and schedules are hidden from the service but may be retained in our database for
        record keeping. No method of storage or transmission is completely secure.
      </p>
    ),
  },
  {
    heading: 'Your Rights',
    body: (
      <>
        <p className={legalText}>Depending on where you live, you may have the right to:</p>
        <ul className={legalList}>
          <li>Access the personal information we hold about you.</li>
          <li>Correct inaccurate information.</li>
          <li>Request deletion of your account and data.</li>
          <li>Receive a copy of your data in a portable format.</li>
        </ul>
        <p className={legalText}>To make a request, contact us at privacy@schedulux.com.</p>
      </>
    ),
  },
  {
    heading: "Children's Privacy",
    body: (
      <p className={legalText}>
        Schedulux is not intended for children under 13, and we do not knowingly collect information from them.
      </p>
    ),
  },
  {
    heading: 'Changes to This Policy',
    body: (
      <p className={legalText}>
        We may update this policy from time to time. We will post the new version on this page and update the
        "Last updated" date.
      </p>
    ),
  },
  {
    heading: 'Contact Us',
    body: <p className={legalText}>Questions about this policy can be sent to privacy@schedulux.com.</p>,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="October 13, 2026"
      intro={
        <p>
          This policy explains what information Schedulux collects when you visit a booking page, run a
          booking page, or book an appointment, and how that information is used.
        </p>
      }
      sections={sections}
    />
  );
}
