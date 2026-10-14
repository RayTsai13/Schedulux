import LegalPageLayout, { legalList, legalText, type LegalSection } from './LegalPageLayout';

// NOTE: Placeholder terms. Have them reviewed by a qualified lawyer before relying on them.

const sections: LegalSection[] = [
  {
    heading: 'Acceptance of Terms',
    body: (
      <p className={legalText}>
        By creating an account or using Schedulux, you agree to these Terms. If you do not agree, do not use the
        service.
      </p>
    ),
  },
  {
    heading: 'The Service',
    body: (
      <p className={legalText}>
        Schedulux is a marketplace that connects independent vendors with clients. Vendors publish storefronts,
        services, availability, and limited-time drops; clients discover vendors and book, reschedule, or cancel
        appointments. Schedulux provides the booking platform only and is not a party to the services vendors
        provide.
      </p>
    ),
  },
  {
    heading: 'Accounts',
    body: (
      <>
        <p className={legalText}>You must provide accurate information when you register. You are responsible for:</p>
        <ul className={legalList}>
          <li>Keeping your password secure.</li>
          <li>All activity that happens under your account.</li>
          <li>Telling us promptly about any unauthorized access.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Vendor Responsibilities',
    body: (
      <ul className={legalList}>
        <li>Keep your storefront details, services, prices, and availability accurate.</li>
        <li>Respond to booking requests and honor appointments you confirm.</li>
        <li>Hold any licenses or permits your services require.</li>
        <li>Only upload images and content you have the right to use.</li>
      </ul>
    ),
  },
  {
    heading: 'Client Responsibilities',
    body: (
      <p className={legalText}>
        Book only appointments you intend to keep, cancel or reschedule as early as you can, and provide an
        accurate address for services performed at your location. Individual vendors may set their own
        cancellation terms.
      </p>
    ),
  },
  {
    heading: 'Acceptable Use',
    body: (
      <>
        <p className={legalText}>You agree not to:</p>
        <ul className={legalList}>
          <li>Use the service for any unlawful purpose.</li>
          <li>Post false, misleading, or infringing content.</li>
          <li>Interfere with the service, attempt unauthorized access, or upload malicious code.</li>
          <li>Use the service to send spam or harass other users.</li>
        </ul>
      </>
    ),
  },
  {
    heading: 'Content',
    body: (
      <p className={legalText}>
        You keep ownership of the content you upload. You grant Schedulux a license to host, display, and
        distribute it as needed to operate the service. The Schedulux name, design, and software remain our
        property.
      </p>
    ),
  },
  {
    heading: 'Payments',
    body: (
      <p className={legalText}>
        Prices shown on storefronts are set by vendors. Schedulux does not currently process payments; any payment
        for a service is arranged directly between the client and the vendor.
      </p>
    ),
  },
  {
    heading: 'Termination',
    body: (
      <p className={legalText}>
        You may stop using Schedulux at any time. We may suspend or close accounts that violate these Terms.
      </p>
    ),
  },
  {
    heading: 'Disclaimers and Limitation of Liability',
    body: (
      <p className={legalText}>
        The service is provided "as is" without warranties of any kind. To the fullest extent permitted by law,
        Schedulux is not liable for indirect or consequential damages, or for the conduct of vendors or clients
        or the quality of services they provide.
      </p>
    ),
  },
  {
    heading: 'Changes to These Terms',
    body: (
      <p className={legalText}>
        We may update these Terms. We will post the new version on this page and update the "Last updated" date.
        Continuing to use the service means you accept the revised Terms.
      </p>
    ),
  },
  {
    heading: 'Contact',
    body: <p className={legalText}>Questions about these Terms can be sent to legal@schedulux.com.</p>,
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="October 13, 2026"
      intro={<p>These Terms govern your use of the Schedulux marketplace and booking platform.</p>}
      sections={sections}
    />
  );
}
