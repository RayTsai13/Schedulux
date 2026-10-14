import LegalPageLayout, { legalList, legalText, type LegalSection } from './LegalPageLayout';

// NOTE: Placeholder policy text describing the app's current browser storage.
// Keep in sync if analytics or third-party scripts are added.

const sections: LegalSection[] = [
  {
    heading: 'Cookies',
    body: (
      <p className={legalText}>
        Schedulux does not set cookies for advertising or cross-site tracking, and does not currently run
        analytics scripts.
      </p>
    ),
  },
  {
    heading: 'Browser Storage We Use',
    body: (
      <>
        <p className={legalText}>
          Instead of cookies, the app stores a small amount of data in your browser's local and session storage.
          All of it is needed for the app to work:
        </p>
        <ul className={legalList}>
          <li><strong>Sign-in:</strong> your authentication token and basic profile, so you stay signed in.</li>
          <li><strong>Preferences:</strong> vendor dashboard settings such as the selected storefront and calendar view.</li>
          <li><strong>Booking in progress:</strong> if you start a booking before signing in, its details are kept for the current tab so you can finish after logging in.</li>
        </ul>
        <p className={legalText}>Signing out removes your sign-in data.</p>
      </>
    ),
  },
  {
    heading: 'Third Parties',
    body: (
      <p className={legalText}>
        Your browser loads fonts and icons from Google Fonts and images from Cloudinary. These providers receive
        standard request information, such as your IP address, under their own privacy policies.
      </p>
    ),
  },
  {
    heading: 'Managing Storage',
    body: (
      <p className={legalText}>
        You can clear site data at any time in your browser settings. Doing so will sign you out and reset your
        preferences.
      </p>
    ),
  },
  {
    heading: 'Changes and Contact',
    body: (
      <p className={legalText}>
        We will update this page if our use of cookies or browser storage changes. Questions can be sent to
        privacy@schedulux.com.
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      lastUpdated="October 13, 2026"
      intro={<p>This page explains what Schedulux stores in your browser and why.</p>}
      sections={sections}
    />
  );
}
