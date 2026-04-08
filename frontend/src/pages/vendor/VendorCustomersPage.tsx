import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStorefronts } from '../../hooks/useStorefronts';
import { useStorefrontAppointments } from '../../hooks/useAppointments';
import DashboardLayout from '../../components/layout/DashboardLayout';
import type { Appointment, Storefront } from '../../services/api';

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
// Customer data derived from appointments
// ---------------------------------------------------------------------------
interface CustomerSummary {
  clientId: number;
  appointmentCount: number;
  completedCount: number;
  totalSpent: number;
  lastVisit: string;
  services: string[];
  storefronts: string[];
}

// ---------------------------------------------------------------------------
// Aggregated appointments hook — same pattern as VendorAppointmentsPage
// ---------------------------------------------------------------------------
function useAllAppointments(storefronts: Storefront[] | undefined) {
  const ids = useMemo(() => (storefronts || []).slice(0, 10).map(s => s.id), [storefronts]);

  const q0 = useStorefrontAppointments(ids[0] ?? null);
  const q1 = useStorefrontAppointments(ids[1] ?? null);
  const q2 = useStorefrontAppointments(ids[2] ?? null);
  const q3 = useStorefrontAppointments(ids[3] ?? null);
  const q4 = useStorefrontAppointments(ids[4] ?? null);

  const queries = [q0, q1, q2, q3, q4].slice(0, ids.length);
  const isLoading = queries.some(q => q.isLoading);

  const appointments = useMemo(() => {
    const all: Appointment[] = [];
    queries.forEach((q) => {
      if (q.data) all.push(...q.data);
    });
    return all;
  }, [queries.map(q => q.data)]);

  return { appointments, isLoading };
}

// ---------------------------------------------------------------------------
// VendorCustomersPage
// ---------------------------------------------------------------------------
export default function VendorCustomersPage() {
  const navigate = useNavigate();
  const { data: storefronts, isLoading: storefrontsLoading } = useStorefronts();
  const { appointments, isLoading: apptLoading } = useAllAppointments(storefronts);

  const isLoading = storefrontsLoading || apptLoading;

  // Derive customer list from appointments
  const customers = useMemo<CustomerSummary[]>(() => {
    const map = new Map<number, CustomerSummary>();

    for (const apt of appointments) {
      const existing = map.get(apt.client_id);
      if (existing) {
        existing.appointmentCount++;
        if (apt.status === 'completed') {
          existing.completedCount++;
          existing.totalSpent += apt.price_final ?? apt.price_quoted ?? 0;
        }
        if (new Date(apt.requested_start_datetime) > new Date(existing.lastVisit)) {
          existing.lastVisit = apt.requested_start_datetime;
        }
        if (apt.service_name && !existing.services.includes(apt.service_name)) {
          existing.services.push(apt.service_name);
        }
        if (apt.storefront_name && !existing.storefronts.includes(apt.storefront_name)) {
          existing.storefronts.push(apt.storefront_name);
        }
      } else {
        map.set(apt.client_id, {
          clientId: apt.client_id,
          appointmentCount: 1,
          completedCount: apt.status === 'completed' ? 1 : 0,
          totalSpent: apt.status === 'completed' ? (apt.price_final ?? apt.price_quoted ?? 0) : 0,
          lastVisit: apt.requested_start_datetime,
          services: apt.service_name ? [apt.service_name] : [],
          storefronts: apt.storefront_name ? [apt.storefront_name] : [],
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      // Sort by most recent visit
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });
  }, [appointments]);

  if (isLoading) {
    return (
      <DashboardLayout title="Customers">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgPerCustomer = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const repeatCustomers = customers.filter(c => c.appointmentCount > 1).length;

  return (
    <DashboardLayout title="Customers">
      <div className="space-y-12">

        {/* ============================================================
         * EDITORIAL HEADER
         * ============================================================ */}
        <header className="max-w-2xl">
          <span className="text-tertiary font-label font-semibold tracking-wider text-xs uppercase mb-4 block">
            Client Relations
          </span>
          <h2 className="text-4xl font-headline font-extrabold text-primary leading-tight tracking-tighter">
            Your Customers
          </h2>
          <p className="mt-3 text-on-surface-variant text-lg font-body max-w-lg leading-relaxed">
            Clients who have booked with you. Build lasting relationships and grow your community.
          </p>
        </header>

        {/* ============================================================
         * METRIC STRIP
         * ============================================================ */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <span className="text-on-surface-variant text-[10px] font-label tracking-widest uppercase">Total Clients</span>
            <h3 className="text-3xl font-bold font-headline text-primary mt-1">{totalCustomers}</h3>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <span className="text-on-surface-variant text-[10px] font-label tracking-widest uppercase">Repeat Clients</span>
            <h3 className="text-3xl font-bold font-headline text-tertiary mt-1">{repeatCustomers}</h3>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl" style={{ borderBottom: '2px solid rgba(191,201,195,0.15)' }}>
            <span className="text-on-surface-variant text-[10px] font-label tracking-widest uppercase">Avg. per Client</span>
            <h3 className="text-3xl font-bold font-headline text-secondary mt-1">${avgPerCustomer}</h3>
          </div>
          <div className="bg-primary p-6 rounded-xl text-on-primary">
            <span className="text-on-primary-container text-[10px] font-label tracking-widest uppercase">Total Revenue</span>
            <h3 className="text-3xl font-bold font-headline mt-1">${totalRevenue.toLocaleString()}</h3>
          </div>
        </section>

        {/* ============================================================
         * CUSTOMERS LIST
         * ============================================================ */}
        {customers.length === 0 ? (
          <div
            className="bg-surface-container-lowest rounded-xl p-16 text-center"
            style={{ boxShadow: '0 20px 40px rgba(27,28,26,0.05)' }}
          >
            <Icon name="group" className="text-7xl text-outline mb-6" />
            <h3 className="text-2xl font-bold text-primary mb-3 font-headline">
              No customers yet
            </h3>
            <p className="text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
              When clients book appointments through your storefronts, they'll appear here.
              Make sure your storefronts are set up and published.
            </p>
            <button
              onClick={() => navigate('/dashboard/storefronts')}
              className="bg-primary text-on-primary px-8 py-3 rounded-md font-bold hover:bg-primary-container transition-all"
            >
              Manage Storefronts
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-label text-on-surface-variant uppercase tracking-widest">
              <span className="col-span-2">Client</span>
              <span className="col-span-3">Services Used</span>
              <span className="col-span-2">Bookings</span>
              <span className="col-span-2">Revenue</span>
              <span className="col-span-2">Last Visit</span>
              <span className="col-span-1"></span>
            </div>

            {customers.map((customer) => {
              const initials = `C${customer.clientId}`;
              return (
                <div
                  key={customer.clientId}
                  className="bg-surface-container-lowest rounded-xl p-6 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-surface-container-low transition-colors group"
                  style={{ boxShadow: '0 8px 24px rgba(27,28,26,0.03)' }}
                >
                  {/* Client */}
                  <div className="col-span-2 flex items-center gap-3 mb-3 md:mb-0">
                    <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-on-secondary-container">{initials}</span>
                    </div>
                    <div>
                      <p className="font-bold text-primary text-sm font-headline">Client #{customer.clientId}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {customer.storefronts.length > 0 ? customer.storefronts[0] : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="col-span-3 mb-2 md:mb-0">
                    <div className="flex flex-wrap gap-1">
                      {customer.services.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant text-[10px] font-bold rounded-full truncate max-w-[120px]"
                        >
                          {s}
                        </span>
                      ))}
                      {customer.services.length > 3 && (
                        <span className="text-[10px] text-on-surface-variant font-label">
                          +{customer.services.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bookings */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="text-sm font-bold text-primary">{customer.appointmentCount}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {customer.completedCount} completed
                    </p>
                  </div>

                  {/* Revenue */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="text-sm font-bold text-primary">
                      ${customer.totalSpent.toLocaleString()}
                    </p>
                  </div>

                  {/* Last Visit */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="text-sm text-on-surface-variant">
                      {new Date(customer.lastVisit).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="col-span-1 text-right">
                    <Icon
                      name="arrow_forward"
                      className="text-sm text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
