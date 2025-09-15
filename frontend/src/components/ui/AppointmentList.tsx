import { Calendar } from 'lucide-react';
import AppointmentCard from './AppointmentCard';

interface AppointmentListProps {
  appointments: Array<{
    id: string;
    title: string;
    time: string;
    status: 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending' | 'no-show';
    date?: string;
    client?: string;
    service?: string;
  }>;
  title?: string;
  showHeader?: boolean;
  onAppointmentClick?: (appointmentId: string) => void;
  className?: string;
}

const AppointmentList = ({ 
  appointments, 
  title = "Schedulux",
  showHeader = true,
  onAppointmentClick,
  className = ""
}: AppointmentListProps) => {
  return (
    <div className={`bg-white rounded-3xl shadow-2xl p-8 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          </div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      )}
      
      <div className="space-y-4">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              title={appointment.title}
              time={appointment.time}
              status={appointment.status}
              date={appointment.date}
              client={appointment.client}
              service={appointment.service}
              onClick={onAppointmentClick ? () => onAppointmentClick(appointment.id) : undefined}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No appointments scheduled</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;
