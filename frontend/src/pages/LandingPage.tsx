import { useNavigate } from 'react-router-dom';
import { Search, Zap, MapPin, CalendarCheck, ArrowRight } from 'lucide-react';
import AppScaffold from '../components/layout/AppScaffold';
import UniversalCard from '../components/universal/UniversalCard';

const features = [
  {
    icon: Search,
    title: 'Discover Vendors',
    description: 'Browse verified local vendors by location, category, and real-time availability.',
  },
  {
    icon: Zap,
    title: 'Scarcity Drops',
    description: 'Limited-time booking windows for exclusive services. First come, first served.',
  },
  {
    icon: MapPin,
    title: 'Mobile Services',
    description: 'Vendors come to you. Filter by mobile services and book at your address.',
  },
  {
    icon: CalendarCheck,
    title: 'Instant Booking',
    description: 'See live availability and confirm in one click. No calls. No waiting.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Discover',
    description: 'Search local vendors by service type, location, or availability. Find the perfect match.',
  },
  {
    number: '02',
    title: 'Book',
    description: 'Pick a time slot that works for you and confirm your appointment instantly.',
  },
  {
    number: '03',
    title: 'Enjoy',
    description: 'Show up and enjoy your service. Rate your experience and rebook with ease.',
  },
];

const stats = [
  { value: '500+', label: 'Active Vendors' },
  { value: '10,000+', label: 'Appointments Booked' },
  { value: '50+', label: 'Cities' },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <AppScaffold noPadding>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-v3-accent to-purple-600 py-28 sm:py-36 lg:py-44">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block mb-6 px-4 py-2 bg-white/15 text-white/90 backdrop-blur rounded-full text-sm font-medium">
            The Booking Marketplace
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
            Book Local Talent.
            <br />
            Instantly.
          </h1>
          <p className="mt-6 text-xl text-white/70 max-w-2xl mx-auto">
            Discover barbers, tattoo artists, handymen, and more. Grab limited drops. Book in seconds.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-indigo-600 hover:bg-zinc-100 font-semibold rounded-full px-8 py-4 text-lg transition-colors inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="border-2 border-white/30 text-white hover:bg-white/10 rounded-full px-8 py-4 text-lg transition-colors font-medium"
            >
              Explore Vendors
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-v3-background py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-v3-primary">
              Everything you need to book
            </h2>
            <p className="mt-4 text-v3-secondary text-lg max-w-2xl mx-auto">
              A modern marketplace connecting you with local service providers.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <UniversalCard key={feature.title} hoverable>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-v3-accent to-purple-500 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-v3-primary mb-2">{feature.title}</h3>
                <p className="text-v3-secondary text-sm leading-relaxed">{feature.description}</p>
              </UniversalCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-v3-surface-highlight py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-v3-primary">How it works</h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Connecting line on desktop */}
            <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] border-t-2 border-dashed border-v3-border" />

            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <span className="text-5xl font-extrabold text-v3-accent/20">{step.number}</span>
                <h3 className="mt-2 text-xl font-bold text-v3-primary">{step.title}</h3>
                <p className="mt-3 text-v3-secondary leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-v3-background py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-5xl font-extrabold text-v3-primary">{stat.value}</div>
                <div className="mt-2 text-v3-secondary text-sm uppercase tracking-wide font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-v3-accent to-purple-600 py-20 sm:py-28">
        {/* Decorative blobs */}
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-pink-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Ready to book your next appointment?
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
            Join thousands of clients and vendors on Schedulux.
          </p>
          <div className="mt-10">
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-indigo-600 hover:bg-zinc-100 font-semibold rounded-full px-8 py-4 text-lg transition-colors inline-flex items-center gap-2"
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-zinc-400 text-sm">
            <span className="font-bold text-white">Schedulux</span>
            {' '}&copy; 2026. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm">
            <a href="/explore" className="text-zinc-400 hover:text-white transition-colors">Explore</a>
            <a href="/login" className="text-zinc-400 hover:text-white transition-colors">Login</a>
            <a href="/register" className="text-zinc-400 hover:text-white transition-colors">Sign Up</a>
          </div>
        </div>
      </footer>
    </AppScaffold>
  );
}
