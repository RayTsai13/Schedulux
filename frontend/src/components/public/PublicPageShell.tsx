import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * Layout for a vendor's public booking pages. Deliberately minimal: this is the
 * vendor's link-in-bio, so Schedulux stays in the footer.
 */
export default function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased flex flex-col">
      <main className="flex-1">{children}</main>
      <footer className="py-8 text-center text-xs text-on-surface-variant">
        Booking by{' '}
        <Link to="/" className="font-semibold text-primary hover:underline underline-offset-4">
          Schedulux
        </Link>
      </footer>
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function PageMessage({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="max-w-lg mx-auto pt-32 px-4 text-center">
      <span className="material-symbols-outlined text-6xl text-outline mb-4">{icon}</span>
      <h1 className="text-3xl font-headline font-bold text-primary mb-2">{title}</h1>
      <p className="text-on-surface-variant">{body}</p>
    </div>
  );
}
