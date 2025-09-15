interface AppointmentCardProps {
  title: string;
  time: string;
  status: 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending' | 'no-show';
  date?: string;
  client?: string;
  service?: string;
  onClick?: () => void;
  className?: string;
}

const AppointmentCard = ({ 
  title, 
  time, 
  status, 
  date,
  client,
  service,
  onClick 
}: AppointmentCardProps) => {
  const getStatusStyles = () => {
    const statusStyles = {
      today: 'bg-green-100 text-green-800 border-l-green-500',
      tomorrow: 'bg-blue-100 text-blue-800 border-l-blue-500',
      upcoming: 'bg-gray-100 text-gray-800 border-l-gray-500',
      completed: 'bg-emerald-100 text-emerald-800 border-l-emerald-500',
      cancelled: 'bg-red-100 text-red-800 border-l-red-500',
      confirmed: 'bg-purple-100 text-purple-800 border-l-purple-500',
      pending: 'bg-yellow-100 text-yellow-800 border-l-yellow-500',
      'no-show': 'bg-orange-100 text-orange-800 border-l-orange-500'
    };

    return statusStyles[status] || statusStyles.upcoming;
  };

  const getStatusLabel = () => {
    const statusLabels = {
      today: 'Today',
      tomorrow: 'Tomorrow',
      upcoming: date || 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
      confirmed: 'Confirmed',
      pending: 'Pending',
      'no-show': 'No Show'
    };

    return statusLabels[status];
  };

  const statusClasses = getStatusStyles();

  return (
    <div 
      className={`${statusClasses} border-l-4 p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium text-gray-800">{title}</span>
        <span className="text-sm font-medium">
          {getStatusLabel()}
        </span>
      </div>
      <p className="text-gray-600 text-sm mb-1">{time}</p>
      {client && (
        <p className="text-gray-500 text-xs">Client: {client}</p>
      )}
      {service && (
        <p className="text-gray-500 text-xs">Service: {service}</p>
      )}
    </div>
  );
};

export default AppointmentCard;
