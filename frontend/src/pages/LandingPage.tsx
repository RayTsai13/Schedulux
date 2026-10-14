import { Link, useNavigate } from 'react-router-dom';
import SpotsMeter from '../components/public/SpotsMeter';

// ---------------------------------------------------------------------------
// Material icon helper — renders a Material Symbols Outlined icon.
// ---------------------------------------------------------------------------
function Icon({ name, className = '', fill = false }: { name: string; className?: string; fill?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const steps = [
  {
    icon: 'link',
    title: 'Claim your link',
    body: 'Pick a handle, add your services and regular hours. Your page lives at schedulux/@you.',
  },
  {
    icon: 'new_releases',
    title: 'Post a drop',
    body: 'A flash day, a pop-up, a few late-night slots. Set the window and how many people per slot.',
  },
  {
    icon: 'ios_share',
    title: 'Share it',
    body: 'Put the drop link in your story. Clients book in a minute — no account, just name and email.',
  },
];

const features = [
  {
    icon: 'hourglass_bottom',
    title: 'Live spot counter',
    body: '"3 of 8 left" updates as people book, so the scarcity is real, not a marketing trick.',
  },
  {
    icon: 'group_add',
    title: 'Waitlist when it sells out',
    body: 'Sold-out drops collect a waitlist. When someone cancels, everyone waiting gets an email.',
  },
  {
    icon: 'mail',
    title: 'No client accounts',
    body: 'Guests get a private link to reschedule or cancel. Nobody has to remember a password.',
  },
  {
    icon: 'lock',
    title: 'Never double-booked',
    body: 'Bookings are serialized per page with a database lock, so the last spot only goes once.',
  },
];

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased">

      {/* ================================================================
       * TOP NAV — frosted glass
       * ================================================================ */}
      <nav
        id="landing-nav"
        className="fixed top-0 w-full z-50 backdrop-blur-glass"
        style={{ backgroundColor: 'var(--glass-bg)' }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-4 sm:px-8 py-4">
          <a href="/" className="text-xl font-extrabold text-primary font-headline tracking-tight">
            Schedulux
          </a>

          <div className="flex items-center gap-6">
            <Link
              to="/playground"
              className="hidden sm:inline text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight"
            >
              Engine playground
            </Link>
            <Link
              to="/login"
              className="text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight"
            >
              Log in
            </Link>
            <button
              onClick={() => navigate('/register')}
              className="bg-primary text-on-primary px-5 py-2.5 rounded-md font-label font-medium hover:bg-primary-container transition-all active:scale-95 duration-200 ease-in-out"
            >
              Claim your link
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-24">

        {/* ================================================================
         * HERO
         * ================================================================ */}
        <section id="hero" className="relative px-4 sm:px-8 py-16 md:py-28 overflow-hidden">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 z-10">
              <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-secondary-container text-on-secondary-container font-label text-sm font-semibold uppercase tracking-widest">
                For barbers, artists &amp; independents
              </span>

              <h1 className="text-5xl md:text-7xl font-extrabold text-primary mb-8 leading-[1.05] tracking-tight font-headline">
                Limited sessions.
                <br />
                <span className="text-tertiary">One link.</span>
              </h1>

              <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Schedulux is a booking page for your bio with <strong className="text-on-surface">drops</strong> built
                in: post a flash day, share the link, and watch the spots go. Clients book without an account.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold text-lg hover:bg-primary-container transition-all shadow-primary-glow"
                >
                  Claim your link — free
                </button>
                <button
                  onClick={() => navigate('/playground')}
                  className="border border-outline-variant text-primary px-8 py-4 rounded-md font-bold text-lg hover:bg-surface-container transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="science" />
                  Try the engine
                </button>
              </div>
            </div>

            {/* Right — a drop, as clients see it */}
            <div className="lg:col-span-5">
              <div className="max-w-sm mx-auto rotate-1">
                <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded-2xl p-8 shadow-editorial">
                  <span className="text-xs font-bold tracking-widest uppercase">Drop</span>
                  <h2 className="text-3xl font-headline font-extrabold leading-tight mt-2">Sunday Flash Day</h2>
                  <p className="font-medium mt-3">Sunday, June 14</p>
                  <p className="opacity-80">12:00 PM–6:00 PM · Small flash</p>
                </div>
                <div className="bg-surface-container-lowest rounded-2xl p-6 mt-4 space-y-4 shadow-editorial">
                  <SpotsMeter remaining={2} total={12} />
                  <div className="w-full bg-primary text-on-primary py-3 rounded-md font-headline font-bold text-center">
                    Claim a spot
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
         * HOW IT WORKS
         * ================================================================ */}
        <section className="px-4 sm:px-8 py-20 bg-surface-container-low">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-primary mb-12">How it works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.title} className="bg-surface-container-lowest rounded-xl p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <Icon name={step.icon} className="text-tertiary" />
                  </div>
                  <h3 className="text-xl font-headline font-bold text-primary mb-2">{step.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================
         * FEATURES
         * ================================================================ */}
        <section className="px-4 sm:px-8 py-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {features.map((f) => (
              <div key={f.title} className="flex gap-5">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center">
                  <Icon name={f.icon} />
                </div>
                <div>
                  <h3 className="text-lg font-headline font-bold text-primary mb-1">{f.title}</h3>
                  <p className="text-on-surface-variant leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================
         * ENGINE CTA
         * ================================================================ */}
        <section className="px-4 sm:px-8 pb-24">
          <div className="max-w-6xl mx-auto bg-primary rounded-3xl p-10 md:p-16 text-on-primary relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-bold tracking-widest uppercase text-on-primary-container">Under the hood</span>
              <h2 className="text-3xl md:text-5xl font-headline font-extrabold mt-3 mb-6">
                A real availability engine.
              </h2>
              <p className="text-lg text-on-primary-container leading-relaxed mb-8">
                Weekly hours, one-off closures, holiday overrides, and drops resolve by priority with a sweep line —
                in the vendor's timezone, across DST. It's an open, standalone package. Stack some rules and watch it work.
              </p>
              <button
                onClick={() => navigate('/playground')}
                className="bg-surface-container-lowest text-primary px-8 py-4 rounded-md font-headline font-bold hover:bg-surface-bright transition-all inline-flex items-center gap-2"
              >
                Open the playground
                <Icon name="arrow_forward" />
              </button>
            </div>
            <Icon name="schedule" className="absolute -right-10 -bottom-16 text-[320px] text-on-primary/5 select-none pointer-events-none" />
          </div>
        </section>
      </main>

      {/* ================================================================
       * FOOTER
       * ================================================================ */}
      <footer className="px-4 sm:px-8 py-12 bg-surface-container-low">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-on-surface-variant">
          <div>
            <p className="text-lg font-extrabold text-primary font-headline">Schedulux</p>
            <p className="mt-1">© {new Date().getFullYear()} Schedulux</p>
          </div>
          <div className="flex gap-6 flex-wrap">
            <Link to="/playground" className="hover:text-primary">Playground</Link>
            <Link to="/privacy" className="hover:text-primary">Privacy</Link>
            <Link to="/terms" className="hover:text-primary">Terms</Link>
            <Link to="/cookies" className="hover:text-primary">Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
