import { format, parseISO } from 'date-fns';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import UniversalButton from '../universal/UniversalButton';
import UniversalCard from '../universal/UniversalCard';
import type { Drop } from '../../services/api';

function fmt12(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

interface DropsTabProps {
  drops: Drop[] | undefined;
  onAddDrop: () => void;
  onEditDrop: (drop: Drop) => void;
  onDeleteDrop: (dropId: number) => void;
}

export default function DropsTab({
  drops,
  onAddDrop,
  onEditDrop,
  onDeleteDrop,
}: DropsTabProps) {
  if (!drops || drops.length === 0) {
    return (
      <UniversalCard className="p-8 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-v3-accent/10 flex items-center justify-center">
          <Plus className="w-6 h-6 text-v3-accent" />
        </div>
        <h3 className="text-lg font-semibold text-v3-primary mb-2">No drops yet</h3>
        <p className="text-v3-secondary mb-6 max-w-sm mx-auto">
          Create curated time windows for your clients to book. Drops are perfect for special sessions,
          flash availability, or limited-time offerings.
        </p>
        <UniversalButton variant="primary" onClick={onAddDrop}>
          <Plus className="w-4 h-4 mr-2" />
          Create First Drop
        </UniversalButton>
      </UniversalCard>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-v3-secondary text-sm">
          {drops.length} drop{drops.length !== 1 ? 's' : ''}
        </p>
        <UniversalButton variant="primary" size="md" onClick={onAddDrop}>
          <Plus className="w-4 h-4 mr-2" />
          New Drop
        </UniversalButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drops.map((drop) => {
          const dropDate = typeof drop.drop_date === 'string'
            ? parseISO(drop.drop_date.substring(0, 10))
            : new Date(drop.drop_date);
          const isPast = dropDate < new Date(new Date().toDateString());

          return (
            <UniversalCard
              key={drop.id}
              className={`p-5 flex flex-col ${isPast ? 'opacity-50' : ''}`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-v3-primary truncate">
                    {drop.title}
                  </h3>
                  <p className="text-sm text-v3-secondary mt-0.5">
                    {format(dropDate, 'EEE, MMM d, yyyy')}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  {drop.is_published ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      Live
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-v3-secondary bg-v3-background px-2 py-1 rounded-full">
                      <EyeOff className="w-3 h-3" />
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Time range */}
              <p className="text-sm text-v3-primary mb-1">
                {fmt12(drop.start_time)} – {fmt12(drop.end_time)}
              </p>

              {/* Description */}
              {drop.description && (
                <p className="text-xs text-v3-secondary line-clamp-2 mb-3">
                  {drop.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-v3-secondary mt-auto pt-3 border-t border-v3-border">
                <span>Max {drop.max_concurrent_appointments} concurrent</span>
                {!drop.is_active && (
                  <span className="text-red-500 font-medium">Inactive</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <UniversalButton variant="ghost" size="sm" onClick={() => onEditDrop(drop)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </UniversalButton>
                <UniversalButton variant="ghost" size="sm" onClick={() => onDeleteDrop(drop.id)}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </UniversalButton>
              </div>
            </UniversalCard>
          );
        })}
      </div>
    </div>
  );
}
