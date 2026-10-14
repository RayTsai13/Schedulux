import React from 'react';
import { Link } from 'react-router-dom';
import AppScaffold from '../../components/layout/AppScaffold';

export interface LegalSection {
  heading: string;
  body: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}

const LEGAL_LINKS = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
  { to: '/cookies', label: 'Cookie Policy' },
];

// Shared prose styles for section bodies
export const legalText = 'text-on-surface-variant leading-relaxed';
export const legalList = 'list-disc pl-6 space-y-2 text-on-surface-variant leading-relaxed';

export default function LegalPageLayout({ title, lastUpdated, intro, sections }: LegalPageLayoutProps) {
  return (
    <AppScaffold>
      <article className="max-w-3xl mx-auto px-6 py-12">
        <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
          Legal
        </span>
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-primary mb-3 tracking-tight">
          {title}
        </h1>
        <p className="text-sm font-label text-outline mb-10">Last updated: {lastUpdated}</p>

        <div className={`${legalText} mb-10 text-lg`}>{intro}</div>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-headline font-bold text-on-surface mb-4">
                {i + 1}. {section.heading}
              </h2>
              <div className="space-y-3">{section.body}</div>
            </section>
          ))}
        </div>

        <nav
          aria-label="Legal documents"
          className="mt-16 pt-8 flex flex-wrap gap-6 border-t border-outline-variant/30"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-label text-on-surface-variant hover:text-tertiary transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </article>
    </AppScaffold>
  );
}
