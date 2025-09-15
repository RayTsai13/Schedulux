import { useState } from 'react';
import { Calendar, Clock, Users, DollarSign, Plus, Filter, Search, Bell } from 'lucide-react';
import { AppointmentList, AppointmentDetailCard, StatusBadge } from '../components/ui';
import type { BaseAppointment, DetailedAppointment } from '../components/ui';

const Dashboard = () => {
  const [selectedView, setSelectedView] = useState<'overview' | 'appointments' | 'clients' | 'analytics'>('overview');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  // Mock data - replace with real data from your backend
  const todayStats = {
    totalAppointments: 12,
    completedAppointments: 8,
    revenue: 1250,
    newClients: 3
  };

  const recentAppointments: BaseAppointment[] = [
    {
      id: '1',
      title: 'Haircut & Style',
      client: 'Sarah Johnson',
      service: 'Premium Cut & Style',
      time: '9:00 AM',
      date: 'Today',
      status: 'completed'
    },
    {
      id: '2',
      title: 'Color Treatment',
      client: 'Mike Chen',
      service: 'Full Color & Highlights',
      time: '11:30 AM',
      date: 'Today',
      status: 'today'
    },
    {
      id: '3',
      title: 'Consultation',
      client: 'Emma Davis',
      service: 'Style Consultation',
      time: '2:00 PM',
      date: 'Today',
      status: 'upcoming'
    },
    {
      id: '4',
      title: 'Wedding Package',
      client: 'Jessica Wilson',
      service: 'Bridal Hair & Makeup',
      time: '10:00 AM',
      date: 'Tomorrow',
      status: 'confirmed'
    }
  ];

  const upcomingAppointments: BaseAppointment[] = [
    {
      id: '5',
      title: 'Deep Conditioning',
      client: 'Alex Rodriguez',
      service: 'Keratin Treatment',
      time: '3:30 PM',
      date: 'Tomorrow',
      status: 'confirmed'
    },
    {
      id: '6',
      title: 'Trim & Blow Dry',
      client: 'Lisa Park',
      service: 'Maintenance Cut',
      time: '1:00 PM',
      date: 'Sept 16',
      status: 'upcoming'
    }
  ];

  const detailedAppointment: DetailedAppointment = {
    id: '2',
    title: 'Color Treatment',
    client: 'Mike Chen',
    service: 'Full Color & Highlights',
    time: '11:30 AM',
    date: 'Today',
    status: 'today',
    duration: 120,
    price: 185,
    phone: '(555) 123-4567',
    email: 'mike.chen@email.com',
    notes: 'Client wants to go darker with subtle highlights. Allergic to ammonia-based products.',
    location: 'Studio A',
    rating: 4.8
  };

  const handleAppointmentClick = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
  };

  const handleComplete = (appointmentId: string) => {
    console.log('Marking appointment as complete:', appointmentId);
    // Implement completion logic
  };

  const handleCancel = (appointmentId: string) => {
    console.log('Cancelling appointment:', appointmentId);
    // Implement cancellation logic
  };

  const StatCard = ({ title, value, icon: Icon, trend, color }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-1">↗ {trend}</p>
          )}
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <span className="text-sm text-gray-500">September 14, 2025</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>New Appointment</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: Calendar },
            { key: 'appointments', label: 'Appointments', icon: Clock },
            { key: 'clients', label: 'Clients', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: DollarSign }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedView(key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                selectedView === key
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Overview Content */}
        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Today's Appointments"
                value={todayStats.totalAppointments}
                icon={Calendar}
                trend="+2 from yesterday"
                color="bg-blue-500"
              />
              <StatCard
                title="Completed Today"
                value={todayStats.completedAppointments}
                icon={Clock}
                trend="67% completion rate"
                color="bg-green-500"
              />
              <StatCard
                title="Today's Revenue"
                value={`$${todayStats.revenue}`}
                icon={DollarSign}
                trend="+15% from last week"
                color="bg-purple-500"
              />
              <StatCard
                title="New Clients"
                value={todayStats.newClients}
                icon={Users}
                trend="This week"
                color="bg-orange-500"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Today's Appointments */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Today's Schedule</h2>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <AppointmentList
                  appointments={recentAppointments}
                  showHeader={false}
                  onAppointmentClick={handleAppointmentClick}
                  className="shadow-sm"
                />
              </div>

              {/* Upcoming Appointments */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming</h2>
                <AppointmentList
                  appointments={upcomingAppointments}
                  showHeader={false}
                  onAppointmentClick={handleAppointmentClick}
                  className="shadow-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Appointments View */}
        {selectedView === 'appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">All Appointments</h2>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <StatusBadge status="today" size="sm" />
                  <StatusBadge status="upcoming" size="sm" />
                  <StatusBadge status="completed" size="sm" />
                </div>
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  View Calendar
                </button>
              </div>
            </div>

            {selectedAppointment ? (
              <div className="space-y-4">
                <button 
                  onClick={() => setSelectedAppointment(null)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Back to list
                </button>
                <AppointmentDetailCard
                  appointment={detailedAppointment}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  onEdit={(id) => console.log('Edit appointment:', id)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AppointmentList
                  appointments={recentAppointments}
                  title="Today's Appointments"
                  onAppointmentClick={handleAppointmentClick}
                />
                <AppointmentList
                  appointments={upcomingAppointments}
                  title="Upcoming Appointments"
                  onAppointmentClick={handleAppointmentClick}
                />
              </div>
            )}
          </div>
        )}

        {/* Placeholder for other views */}
        {selectedView === 'clients' && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Client Management</h2>
            <p className="text-gray-600">Client management features coming soon...</p>
          </div>
        )}

        {selectedView === 'analytics' && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600">Analytics dashboard coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
