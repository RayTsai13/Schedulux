import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './hooks/useAuth';
import AppScaffold from './components/layout/AppScaffold';
import UniversalButton from './components/universal/UniversalButton';
import DropCard from './components/booking/DropCard';
import PortfolioCard from './components/booking/PortfolioCard';
import VendorProfilePage from './pages/VendorProfilePage';
import ExplorePage from './pages/ExplorePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <AppScaffold>
              <div className="space-y-8">
                {/* Test Typography */}
                <div>
                  <h1 className="text-6xl font-bold text-v3-primary mb-2">
                    The Midnight Barber
                  </h1>
                  <p className="text-xl text-v3-secondary">
                    Premium grooming in San Francisco
                  </p>
                </div>

                {/* Test Buttons */}
                <div className="flex flex-wrap gap-4">
                  <UniversalButton variant="primary" size="lg">
                    Book Appointment
                  </UniversalButton>
                  <UniversalButton variant="secondary" size="lg">
                    View Portfolio
                  </UniversalButton>
                  <UniversalButton variant="outline" size="lg">
                    Learn More
                  </UniversalButton>
                  <UniversalButton variant="ghost" size="lg">
                    Contact
                  </UniversalButton>
                </div>

                {/* Test Button Sizes */}
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Button Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <UniversalButton variant="primary" size="sm">
                      Small
                    </UniversalButton>
                    <UniversalButton variant="primary" size="md">
                      Medium
                    </UniversalButton>
                    <UniversalButton variant="primary" size="lg">
                      Large
                    </UniversalButton>
                  </div>
                </div>

                {/* Test Button States */}
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Button States</h3>
                  <div className="flex flex-wrap gap-4">
                    <UniversalButton variant="primary" isLoading>
                      Loading...
                    </UniversalButton>
                    <UniversalButton variant="primary" disabled>
                      Disabled
                    </UniversalButton>
                  </div>
                </div>

                {/* Test Card */}
                <div className="bg-v3-surface border border-v3-border rounded-3xl p-8 max-w-2xl">
                  <h3 className="text-2xl font-semibold mb-4">Design System Test</h3>
                  <p className="text-v3-secondary mb-6">
                    This card demonstrates the V3 design language: high contrast,
                    large rounded corners, clean typography, and generous white space.
                  </p>
                  <div className="flex gap-3">
                    <UniversalButton variant="primary">Primary Action</UniversalButton>
                    <UniversalButton variant="outline">Secondary</UniversalButton>
                  </div>
                </div>

                {/* Color Palette Reference */}
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Color Palette</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="h-20 bg-v3-background border border-v3-border rounded-xl"></div>
                      <p className="text-sm text-v3-secondary">Background</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-20 bg-v3-surface border border-v3-border rounded-xl"></div>
                      <p className="text-sm text-v3-secondary">Surface</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-20 bg-v3-primary rounded-xl"></div>
                      <p className="text-sm text-v3-secondary">Primary</p>
                    </div>
                    <div className="space-y-2">
                      <div className="h-20 bg-v3-accent rounded-xl"></div>
                      <p className="text-sm text-v3-secondary">Accent</p>
                    </div>
                  </div>
                </div>

                {/* Component Showcase Section */}
                <div>
                  <h2 className="text-4xl font-bold text-v3-primary mb-6">
                    Phase 2: Creator Components
                  </h2>

                  {/* Drop Card Example */}
                  <div className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Drop Card (Availability Window)</h3>
                    <DropCard
                      title="Friday Night Session"
                      date={new Date(2026, 1, 27)}
                      totalSlots={8}
                      availableSlots={3}
                      onSelect={() => alert('Drop card clicked!')}
                    />
                  </div>

                  {/* Portfolio Cards Example */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-4">Portfolio Cards (Services)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                      {/* Card with image */}
                      <PortfolioCard
                        title="Classic Fade"
                        price={75}
                        duration={45}
                        imageUrl="https://images.unsplash.com/photo-1622296346914-e35e4d13dc50?w=800&q=80"
                        onSelect={() => alert('Classic Fade selected!')}
                      />

                      {/* Card without image (placeholder) */}
                      <PortfolioCard
                        title="Beard Trim & Shape"
                        price={40}
                        duration={30}
                        onSelect={() => alert('Beard Trim selected!')}
                      />
                    </div>
                  </div>
                </div>

                {/* Phase 3: Vendor Profile Test Link */}
                <div className="mt-8">
                  <h3 className="text-2xl font-semibold mb-4">Phase 3: Vendor Profile Page</h3>
                  <a
                    href="/book/111"
                    className="inline-flex items-center gap-2 text-v3-accent hover:text-v3-accent/80 font-medium"
                  >
                    → View The Midnight Barber Profile (ID: 111)
                  </a>
                </div>
              </div>
            </AppScaffold>
          } />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/book/:storefrontId" element={<VendorProfilePage />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}

export default App;
