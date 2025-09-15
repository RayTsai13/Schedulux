interface StatusBadgeProps {
  status: 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending' | 'no-show';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusBadge = ({ status, size = 'md', className = '' }: StatusBadgeProps) => {
  const getStatusStyles = () => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full';
    
    const sizeStyles = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-2 text-base'
    };

    const statusStyles = {
      today: 'bg-green-100 text-green-800 border border-green-200',
      tomorrow: 'bg-blue-100 text-blue-800 border border-blue-200',
      upcoming: 'bg-gray-100 text-gray-800 border border-gray-200',
      completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border border-red-200',
      confirmed: 'bg-purple-100 text-purple-800 border border-purple-200',
      pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'no-show': 'bg-orange-100 text-orange-800 border border-orange-200'
    };

    return `${baseStyles} ${sizeStyles[size]} ${statusStyles[status]} ${className}`;
  };

  const getStatusText = () => {
    const statusText = {
      today: 'Today',
      tomorrow: 'Tomorrow',
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
      confirmed: 'Confirmed',
      pending: 'Pending',
      'no-show': 'No Show'
    };

    return statusText[status];
  };

  return (
    <span className={getStatusStyles()}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;
