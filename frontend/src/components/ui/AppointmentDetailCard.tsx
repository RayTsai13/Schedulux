import { Clock, User, Calendar, Star, Settings } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface AppointmentDetailCardProps {
  appointment: {
    id: string;
    title: string;
    client: string;
    service: string;
    date: string;
    time: string;
    duration: number;
    status: 'today' | 'tomorrow' | 'upcoming' | 'completed' | 'cancelled' | 'confirmed' | 'pending' | 'no-show';
    notes?: string;
    price?: number;
    location?: string;
    phone?: string;
    email?: string;
    rating?: number;
  };
  onEdit?: (appointmentId: string) => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
  className?: string;
}

const AppointmentDetailCard = ({ 
  appointment, 
  onEdit, 
  onCancel, 
  onComplete,
  className = "" 
}: AppointmentDetailCardProps) => {
  const {
    id,
    title,
    client,
    service,
    date,
    time,
    duration,
    status,
    notes,
    price,
    location,
    phone,
    email,
    rating
  } = appointment;

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">{title}</h3>
          <div className="flex items-center space-x-2">
            <StatusBadge status={status} />
            {rating && (
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{client}</p>
              {phone && <p className="text-sm text-gray-500">{phone}</p>}
              {email && <p className="text-sm text-gray-500">{email}</p>}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{date}</p>
              {location && <p className="text-sm text-gray-500">{location}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{time}</p>
              <p className="text-sm text-gray-500">{duration} minutes</p>
            </div>
          </div>
          
          <div>
            <p className="font-medium text-gray-900 mb-1">Service</p>
            <p className="text-gray-600">{service}</p>
            {price && (
              <p className="text-lg font-semibold text-green-600 mt-1">
                ${price.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="mb-4">
          <p className="font-medium text-gray-900 mb-2">Notes</p>
          <p className="text-gray-600 bg-gray-50 rounded-lg p-3">{notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {status === 'upcoming' || status === 'confirmed' ? (
          <>
            {onComplete && (
              <button
                onClick={() => onComplete(id)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                Mark Complete
              </button>
            )}
            {onCancel && (
              <button
                onClick={() => onCancel(id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </>
        ) : status === 'completed' ? (
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
            ✓ Completed
          </span>
        ) : status === 'cancelled' ? (
          <span className="px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium">
            ✗ Cancelled
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default AppointmentDetailCard;
