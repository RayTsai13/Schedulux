import { useNavigate } from 'react-router-dom';

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
const testimonials = [
  {
    quote:
      '"Finding a community that understands the unique rhythm of doing business in Oregon has been a game-changer. Schedulux isn\'t just a platform; it\'s our digital town square."',
    name: 'Elena Rivers',
    title: 'Founder, Cedar & Moss Studio',
    initials: 'ER',
  },
  {
    quote:
      '"The marketplace allowed us to scale our artisan coffee distribution without losing the personal touch that our customers in Ballard love. It\'s growth with integrity."',
    name: 'Marcus Thorne',
    title: 'Owner, Sound Roast Coffee',
    initials: 'MT',
  },
];

const footerNav = [
  { heading: 'Navigation', links: ['Local Directory', 'Sustainability Pact', 'Partner Onboarding'] },
  { heading: 'Legal', links: ['Privacy Policy', 'Terms of Growth'] },
];

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased">

      {/* ================================================================
       * TOP NAV — frosted glass, editorial links
       * ================================================================ */}
      <nav
        id="landing-nav"
        className="fixed top-0 w-full z-50 backdrop-blur-glass"
        style={{ backgroundColor: 'var(--glass-bg)' }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-8 py-4">
          {/* Brand */}
          <a
            href="/"
            className="text-xl font-extrabold text-primary font-headline tracking-tight"
          >
            Schedulux
          </a>

          {/* Desktop Links */}
          <div className="hidden md:flex space-x-8 items-center">
            {['Growth', 'Marketplace', 'Community', 'About'].map((label, i) => (
              <a
                key={label}
                href="#"
                className={
                  i === 0
                    ? 'text-primary font-semibold border-b-2 border-tertiary pb-1 font-headline tracking-tight'
                    : 'text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight'
                }
              >
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/register')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-md font-label font-medium hover:bg-primary-container transition-all active:scale-95 duration-200 ease-in-out"
          >
            Join us
          </button>
        </div>
      </nav>

      <main className="pt-24">

        {/* ================================================================
         * HERO SECTION — asymmetric 12-col grid
         * ================================================================ */}
        <section id="hero" className="relative px-8 py-20 md:py-32 overflow-hidden">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left — Copy */}
            <div className="lg:col-span-7 z-10">
              <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-secondary-container text-on-secondary-container font-label text-sm font-semibold uppercase tracking-widest">
                PNW Local Network
              </span>

              <h1 className="text-5xl md:text-7xl font-extrabold text-primary mb-8 leading-[1.1] tracking-tight font-headline">
                Rooted in Growth.{' '}
                <br />
                <span className="text-tertiary">Local by Nature.</span>
              </h1>

              <p className="text-lg md:text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
                Schedulux is a bespoke sanctuary for local entrepreneurs. We provide the tools, the community, and
                the&nbsp;foundation for your small business to flourish.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-primary text-on-primary px-8 py-4 rounded-md font-bold text-lg hover:bg-primary-container transition-all shadow-primary-glow"
                >
                  Start Growing
                </button>
                <button
                  onClick={() => navigate('/explore')}
                  className="text-tertiary flex items-center gap-2 font-bold px-8 py-4 group"
                >
                  Explore the Directory
                  <Icon
                    name="arrow_forward"
                    className="group-hover:translate-x-1 transition-transform text-xl"
                  />
                </button>
              </div>
            </div>

            {/* Right — Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/5] rounded-xl overflow-hidden bg-surface-container-low relative">
                <img
                  alt="Mist-covered evergreen forest in the Pacific Northwest"
                  className="w-full h-full object-cover"
                  style={{ filter: 'grayscale(20%) sepia(10%)' }}
                  src="/images/hero-forest.png"
                />
                {/* Glass stat overlay */}
                <div className="absolute bottom-6 left-6 right-6 p-6 bg-surface-container-lowest/90 backdrop-blur-glass rounded-lg">
                  <p className="text-sm font-label text-tertiary font-bold mb-1 uppercase tracking-widest">
                    Currently Sprouting
                  </p>
                  <p className="text-lg font-headline font-bold text-primary">
                    420+ Local Partners in Portland &amp; Seattle
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ================================================================
         * FEATURE GRID (Bento)
         * ================================================================ */}
        <section id="features" className="py-24 px-8 bg-surface-container-low">
          <div className="max-w-7xl mx-auto">

            {/* Section Header */}
            <div className="mb-16">
              <h2 className="text-4xl font-extrabold text-primary mb-4 font-headline">
                Our Ecosystem
              </h2>
              <p className="text-on-surface-variant max-w-2xl">
                A curated suite of tools designed to cultivate connections and sustainable commerce across the cascades.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Tall Card — Community Directory */}
              <div className="md:row-span-2 bg-surface-container-lowest p-10 rounded-xl flex flex-col justify-between group hover:shadow-editorial transition-shadow">
                <div>
                  <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-on-secondary-container mb-8">
                    <Icon name="forest" fill />
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-4 font-headline">
                    Community Directory
                  </h3>
                  <p className="text-on-surface-variant leading-relaxed">
                    Visibility where it matters. Our directory isn't just a list—it's a curated map of sustainable local excellence.
                  </p>
                </div>
                <div className="mt-12 overflow-hidden rounded-lg aspect-video bg-surface-container">
                  <img
                    alt="Local marketplace stall with greenery"
                    className="w-full h-full object-cover opacity-80"
                    src="/images/market-stall.png"
                  />
                </div>
              </div>

              {/* Wide Card — Marketplace Hive */}
              <div className="md:col-span-2 bg-primary text-on-primary p-10 rounded-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-4 font-headline">The Marketplace Hive</h3>
                    <p className="text-on-primary/80 mb-6 max-w-md">
                      Exchange goods and services with a community that values craft over convenience. No high fees, just high standards.
                    </p>
                    <button
                      onClick={() => navigate('/explore')}
                      className="bg-surface text-primary px-6 py-2 rounded-md font-bold hover:bg-surface-container-low transition-colors"
                    >
                      Open Shop
                    </button>
                  </div>
                  <div className="flex-1 hidden md:flex justify-center">
                    <Icon name="hive" fill className="text-[120px] opacity-20" />
                  </div>
                </div>
                {/* Decorative Blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container rounded-full -mr-20 -mt-20 blur-3xl opacity-50" />
              </div>

              {/* Small Card — Partner Onboarding */}
              <div className="bg-surface-container-lowest p-8 rounded-xl border-b-4 border-secondary-container">
                <Icon name="handshake" fill className="text-tertiary mb-4" />
                <h4 className="text-xl font-bold text-primary mb-2 font-headline">Partner Onboarding</h4>
                <p className="text-sm text-on-surface-variant">
                  Smooth integration into our network with dedicated local support.
                </p>
              </div>

              {/* Small Card — Sustainability */}
              <div className="bg-surface-container-lowest p-8 rounded-xl border-b-4 border-tertiary-fixed">
                <Icon name="eco" fill className="text-tertiary mb-4" />
                <h4 className="text-xl font-bold text-primary mb-2 font-headline">Sustainability Pact</h4>
                <p className="text-sm text-on-surface-variant">
                  Join businesses committed to keeping the PNW green and thriving.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ================================================================
         * TESTIMONIALS — "Voices of the PNW"
         * ================================================================ */}
        <section id="testimonials" className="py-24 px-8 bg-surface">
          <div className="max-w-7xl mx-auto">

            {/* Header row */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-4xl font-extrabold text-primary mb-4 font-headline">
                  Voices of the PNW
                </h2>
                <p className="text-on-surface-variant">
                  Real stories from the owners who are defining the modern naturalist movement in our cities.
                </p>
              </div>
              <div className="flex gap-2">
                <button className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-surface-container transition-colors">
                  <Icon name="chevron_left" />
                </button>
                <button className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center text-primary hover:bg-surface-container transition-colors">
                  <Icon name="chevron_right" />
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((t) => (
                <div key={t.name} className="p-10 bg-surface-container-low rounded-xl relative">
                  <Icon
                    name="format_quote"
                    className="text-tertiary-fixed-dim absolute top-6 right-8 text-6xl opacity-30"
                  />
                  <p className="text-xl font-headline italic text-primary leading-relaxed mb-8">
                    {t.quote}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-headline font-bold text-lg">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold text-primary">{t.name}</p>
                      <p className="text-sm text-on-surface-variant">{t.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ================================================================
         * CTA SECTION
         * ================================================================ */}
        <section id="cta" className="py-24 px-8">
          <div className="max-w-7xl mx-auto rounded-3xl bg-primary-container p-12 md:p-24 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-extrabold text-on-primary mb-8 max-w-3xl mx-auto leading-tight font-headline">
                Ready to plant your roots in our network?
              </h2>
              <p className="text-on-primary/70 text-lg md:text-xl mb-12 max-w-xl mx-auto">
                Join the hundreds of local PNW businesses already thriving within our shared ecosystem.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-secondary-fixed text-on-secondary-fixed px-10 py-4 rounded-md font-bold text-lg hover:bg-secondary-fixed-dim transition-all"
                >
                  Become a Partner
                </button>
                <button className="bg-transparent border-2 border-on-primary/30 text-on-primary px-10 py-4 rounded-md font-bold text-lg hover:bg-on-primary/10 transition-all">
                  View the Pact
                </button>
              </div>
            </div>

            {/* Decorative gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary to-transparent opacity-50" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tertiary-container rounded-full blur-3xl opacity-30" />
          </div>
        </section>

      </main>

      {/* ================================================================
       * FOOTER — 4-column on surface-container-low
       * ================================================================ */}
      <footer
        id="landing-footer"
        className="w-full py-16 px-8 grid grid-cols-1 md:grid-cols-4 gap-12 bg-surface-container-low"
        style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}
      >
        {/* Brand column */}
        <div className="md:col-span-1">
          <div className="text-lg font-bold text-primary mb-6 font-headline">Schedulux</div>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            © 2026 Schedulux. Rooted in the Pacific Northwest. Our mission is to preserve the independent spirit of our local economy.
          </p>
        </div>

        {/* Nav columns */}
        {footerNav.map((col) => (
          <div key={col.heading} className="flex flex-col space-y-4">
            <h4 className="font-bold text-primary font-label text-sm uppercase tracking-widest">
              {col.heading}
            </h4>
            {col.links.map((link) => (
              <a
                key={link}
                href="#"
                className="text-on-surface-variant hover:text-tertiary transition-all text-sm"
              >
                {link}
              </a>
            ))}
          </div>
        ))}

        {/* Connect column */}
        <div className="flex flex-col space-y-4">
          <h4 className="font-bold text-primary font-label text-sm uppercase tracking-widest">
            Connect
          </h4>
          <a href="#" className="text-on-surface-variant hover:text-tertiary transition-all text-sm">
            Contact Support
          </a>
          <div className="flex gap-4 mt-2">
            <Icon name="hub" className="text-primary" />
            <Icon name="potted_plant" className="text-primary" />
          </div>
        </div>
      </footer>
    </div>
  );
}
