import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMarketplaceSearch, useGeolocation, useDebounce } from '../hooks/useMarketplaceSearch';
import { useAuth } from '../hooks/useAuth';
import { useStorefronts } from '../hooks/useStorefronts';
import StorefrontCard from '../components/marketplace/StorefrontCard';

// ---------------------------------------------------------------------------
// Icon helper
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
// Filter chip categories
// ---------------------------------------------------------------------------
const CATEGORIES = [
  { label: 'All Industries', value: null },
  { label: 'Agriculture', value: 'agriculture' },
  { label: 'Crafts', value: 'crafts' },
  { label: 'Wellness', value: 'wellness' },
  { label: 'Education', value: 'education' },
];

type LocationType = 'fixed' | 'mobile' | 'hybrid';

// ---------------------------------------------------------------------------
// ExplorePage — Local Marketplace
// ---------------------------------------------------------------------------
export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { user, isAuthenticated } = useAuth();
  const { data: myStorefronts } = useStorefronts();
  const { location, error: geoError, isLoading: geoLoading, requestLocation, clearLocation } = useGeolocation();
  const activeLocationType = searchParams.get('location_type') as LocationType | null;
  const activeCategory = searchParams.get('category') || null;

  // Owned storefront IDs
  const ownedStorefrontIds = useMemo(() => {
    if (!isAuthenticated || !myStorefronts || user?.role !== 'vendor') return new Set<number>();
    return new Set(myStorefronts.map((sf) => sf.id));
  }, [isAuthenticated, myStorefronts, user?.role]);

  const searchParamsObj = {
    query: debouncedQuery || undefined,
    location_type: activeLocationType || undefined,
    latitude: location?.latitude,
    longitude: location?.longitude,
    radius: location ? 25 : undefined,
    limit: 12,
    offset: 0,
  };

  const { data, isLoading, isError, error } = useMarketplaceSearch(searchParamsObj);

  const updateFilter = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const formatLocation = (storefront: any) => {
    if (storefront.location_type === 'mobile') {
      return storefront.service_area_city ? `Serves ${storefront.service_area_city} area` : 'Mobile service';
    }
    return [storefront.city, storefront.state].filter(Boolean).join(', ') || 'Location not specified';
  };

  return (
    <div className="min-h-screen w-full bg-surface font-body text-on-surface antialiased">

      {/* ================================================================
       * TOP NAV — reuses the landing page nav style
       * ================================================================ */}
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-glass"
        style={{ backgroundColor: 'var(--glass-bg)' }}
      >
        <div className="max-w-screen-2xl mx-auto flex justify-between items-center px-8 py-4">
          <a href="/" className="text-xl font-extrabold text-primary font-headline tracking-tight">
            Schedulux
          </a>
          <div className="hidden md:flex space-x-8 items-center">
            {['Growth', 'Marketplace', 'Community', 'About'].map((label) => (
              <a
                key={label}
                href="#"
                className={
                  label === 'Marketplace'
                    ? 'text-primary font-semibold border-b-2 border-tertiary pb-1 font-headline tracking-tight'
                    : 'text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight'
                }
              >
                {label}
              </a>
            ))}
          </div>
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
         * EDITORIAL HERO HEADER
         * ================================================================ */}
        <section className="px-8 py-16 md:py-24 max-w-screen-xl mx-auto">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-8">
              <span className="text-tertiary font-bold tracking-widest text-xs uppercase mb-4 block font-label">
                The Local Directory
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-primary leading-tight -ml-1 font-headline">
                Curated Goods &amp;{' '}
                <br className="hidden md:block" />
                Bespoke Services.
              </h1>
            </div>
            <div className="md:col-span-4 pb-2">
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Supporting the artisans, growers, and practitioners of the Pacific Northwest. Every
                partner is vetted for sustainability and community impact.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
         * STICKY SEARCH + FILTER BAR
         * ================================================================ */}
        <section className="bg-surface-container-low sticky top-[72px] z-40">
          <div className="max-w-screen-xl mx-auto px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Search */}
            <div className="relative w-full md:w-1/3">
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
              <input
                type="text"
                placeholder="Search by business or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-lowest border-0 border-b-2 border-outline-variant/30 focus:ring-0 focus:border-primary pl-12 py-3 transition-all font-body text-on-surface placeholder-outline"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Location button + Category filters */}
            <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto">
              {/* Location toggle */}
              <button
                onClick={location ? clearLocation : requestLocation}
                className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  location
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high'
                }`}
                style={!location ? { border: '1px solid rgba(191,201,195,0.20)' } : undefined}
              >
                <Icon name={location ? 'my_location' : 'location_searching'} className="text-sm" />
                {geoLoading ? 'Locating…' : location ? 'Near me' : 'My location'}
              </button>

              <span className="text-on-surface-variant text-sm font-semibold mr-1 whitespace-nowrap hidden md:inline">
                Filter:
              </span>
              {CATEGORIES.map((cat) => {
                const isActive =
                  (cat.value === null && !activeCategory) || activeCategory === cat.value;
                return (
                  <button
                    key={cat.label}
                    onClick={() => updateFilter('category', cat.value)}
                    className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-secondary-fixed text-on-secondary-fixed'
                        : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Geo error */}
        {geoError && (
          <div className="max-w-screen-xl mx-auto px-8 pt-4">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed text-sm">
              <Icon name="warning" className="text-lg" />
              {geoError}. Showing all storefronts instead.
            </div>
          </div>
        )}

        {/* ================================================================
         * MARKETPLACE GRID
         * ================================================================ */}
        <section className="px-8 py-16 max-w-screen-xl mx-auto">

          {/* Results count */}
          {data && (
            <div className="mb-8 text-sm text-on-surface-variant font-label">
              Showing {data.storefronts.length} of {data.total_count} storefronts
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && !data && (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="max-w-md mx-auto p-8 bg-error-container rounded-xl text-center">
              <Icon name="error" className="text-4xl text-on-error-container mb-4" />
              <h3 className="text-lg font-bold text-on-error-container mb-2 font-headline">Something went wrong</h3>
              <p className="text-on-error-container/80">{error?.message || 'Failed to load storefronts'}</p>
            </div>
          )}

          {/* Empty state */}
          {data && data.storefronts.length === 0 && (
            <div className="max-w-md mx-auto py-24 text-center">
              <Icon name="search_off" className="text-6xl text-outline mb-6" />
              <h3 className="text-2xl font-bold text-primary mb-2 font-headline">No storefronts found</h3>
              <p className="text-on-surface-variant mb-8">Try adjusting your filters or search query</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  updateFilter('location_type', null);
                  updateFilter('category', null);
                  clearLocation();
                }}
                className="text-primary font-bold flex items-center gap-1 mx-auto hover:underline underline-offset-4"
              >
                <Icon name="restart_alt" className="text-lg" />
                Clear all filters
              </button>
            </div>
          )}

          {/* Grid — with asymmetric offsets on 3rd card like the reference */}
          {data && data.storefronts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {data.storefronts.map((storefront, index) => (
                <div
                  key={storefront.id}
                  className={
                    // Reference uses lg:mt-12 on 3rd card and lg:-mt-12 on 4th for asymmetry
                    index % 6 === 2
                      ? 'lg:mt-12'
                      : index % 6 === 3
                      ? 'lg:-mt-12'
                      : ''
                  }
                >
                  <StorefrontCard
                    id={storefront.id}
                    name={storefront.name}
                    description={storefront.description}
                    avatarUrl={storefront.avatar_url}
                    locationType={storefront.location_type}
                    isVerified={storefront.is_verified}
                    location={formatLocation(storefront)}
                    serviceCount={storefront.service_count}
                    priceRange={storefront.price_range}
                    distanceMiles={storefront.distance_miles}
                    isOwned={ownedStorefrontIds.has(storefront.id)}
                    serviceCategories={storefront.service_categories}
                  />
                </div>
              ))}

              {/* Inline CTA Card — appears after storefronts */}
              <div className="bg-primary p-8 rounded-lg flex flex-col justify-between text-on-primary">
                <div>
                  <h3 className="text-3xl font-bold mb-4 font-headline">Your business belongs here.</h3>
                  <p className="text-primary-fixed leading-relaxed">
                    Join over 200 local partners who prioritize craftsmanship and the environment.
                  </p>
                </div>
                <div className="space-y-4 mt-8">
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm">
                      <Icon name="check_circle" className="text-secondary-fixed" />
                      Zero commission on first $1k
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Icon name="check_circle" className="text-secondary-fixed" />
                      Community marketing reach
                    </li>
                  </ul>
                  <button
                    onClick={() => navigate('/register')}
                    className="w-full bg-tertiary-fixed text-on-tertiary-fixed py-4 rounded-md font-bold hover:bg-tertiary-fixed-dim transition-colors"
                  >
                    Apply to Partner
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ================================================================
         * FINDING YOUR NATURAL NEIGHBORS — Feature section
         * ================================================================ */}
        <section className="bg-surface-container-low py-24 px-8 overflow-hidden">
          <div className="max-w-screen-xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Map visual */}
              <div className="order-2 lg:order-1">
                <div className="aspect-square bg-surface-container-highest rounded-full border-8 border-surface-container-lowest overflow-hidden shadow-2xl">
                  <img
                    className="w-full h-full object-cover grayscale opacity-50 mix-blend-multiply"
                    src="/images/hero-forest.png"
                    alt="Pacific Northwest topographic landscape"
                  />
                </div>
              </div>

              {/* Copy */}
              <div className="order-1 lg:order-2 space-y-8">
                <h2 className="text-4xl md:text-5xl font-extrabold text-primary leading-tight font-headline">
                  Finding Your
                  <br />
                  Natural Neighbors.
                </h2>
                <p className="text-on-surface-variant text-lg leading-relaxed">
                  Our interactive directory doesn't just show you where to shop; it shows you where to
                  grow. Discover local supply chains, workshops, and communal resources near you.
                </p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="bg-surface-container-lowest p-3 rounded-lg">
                      <Icon name="eco" className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary font-headline">Sustainability Tracked</h4>
                      <p className="text-sm text-on-surface-variant">
                        We verify the sourcing of every business in our network.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-surface-container-lowest p-3 rounded-lg">
                      <Icon name="groups" className="text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary font-headline">Direct Communication</h4>
                      <p className="text-sm text-on-surface-variant">
                        Talk directly with makers and service providers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ================================================================
       * FOOTER
       * ================================================================ */}
      <footer
        className="w-full py-16 px-8 grid grid-cols-1 md:grid-cols-4 gap-12 bg-surface-container-low"
        style={{ borderTop: '1px solid rgba(191,201,195,0.15)' }}
      >
        <div className="md:col-span-1">
          <div className="text-lg font-bold text-primary mb-6 font-headline">Schedulux</div>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            © 2026 Schedulux. Rooted in the Pacific Northwest. Supporting local ecosystems one
            business at a time.
          </p>
        </div>
        <div className="flex flex-col space-y-4">
          <h4 className="font-bold text-primary font-label text-sm uppercase tracking-widest">Explore</h4>
          <a href="#" className="text-on-surface-variant hover:text-tertiary transition-all text-sm">Local Directory</a>
          <a href="#" className="text-on-surface-variant hover:text-tertiary transition-all text-sm">Sustainability Pact</a>
          <a href="#" className="text-on-surface-variant hover:text-tertiary transition-all text-sm">Partner Onboarding</a>
        </div>
        <div className="flex flex-col space-y-4">
          <h4 className="font-bold text-primary font-label text-sm uppercase tracking-widest">Connect</h4>
          <a href="#" className="text-on-surface-variant hover:text-tertiary transition-all text-sm">Privacy Policy</a>
          <a href="#" className="text-on-surface-variant hover:text-tertiary transition-all text-sm">Contact Support</a>
        </div>
        <div className="flex flex-col space-y-4">
          <h4 className="font-bold text-primary font-label text-sm uppercase tracking-widest">Newsletter</h4>
          <p className="text-on-surface-variant text-sm">Get seasonal field guides and local artisan spotlights.</p>
          <div className="relative">
            <input
              className="w-full bg-surface-container-lowest/50 border-0 border-b border-outline py-2 focus:ring-0 focus:border-primary transition-colors font-body italic text-on-surface placeholder-outline"
              placeholder="email address"
              type="email"
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">
              Sign Up
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
