import { useState, useMemo } from 'react';
import { Globe, Search, Check } from 'lucide-react';

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
  error?: string;
}

const TimezoneSelector = ({ value, onChange, error }: TimezoneSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Get all IANA timezones
  const allTimezones = useMemo(() => {
    try {
      // Use Intl API to get supported timezones
      const timezones = Intl.supportedValuesOf('timeZone');

      // Get UTC offset for each timezone
      return timezones.map((tz) => {
        try {
          const now = new Date();
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            timeZoneName: 'shortOffset',
          });
          const parts = formatter.formatToParts(now);
          const offsetPart = parts.find((part) => part.type === 'timeZoneName');
          const offset = offsetPart?.value || '';

          return {
            value: tz,
            label: tz.replace(/_/g, ' '),
            offset,
            region: tz.split('/')[0],
          };
        } catch {
          return {
            value: tz,
            label: tz.replace(/_/g, ' '),
            offset: '',
            region: tz.split('/')[0],
          };
        }
      });
    } catch {
      // Fallback to common timezones if Intl API not supported
      return [
        { value: 'UTC', label: 'UTC', offset: 'GMT', region: 'UTC' },
        { value: 'America/New_York', label: 'America/New York', offset: 'GMT-5', region: 'America' },
        { value: 'America/Chicago', label: 'America/Chicago', offset: 'GMT-6', region: 'America' },
        { value: 'America/Denver', label: 'America/Denver', offset: 'GMT-7', region: 'America' },
        { value: 'America/Los_Angeles', label: 'America/Los Angeles', offset: 'GMT-8', region: 'America' },
        { value: 'Europe/London', label: 'Europe/London', offset: 'GMT', region: 'Europe' },
        { value: 'Europe/Paris', label: 'Europe/Paris', offset: 'GMT+1', region: 'Europe' },
        { value: 'Asia/Tokyo', label: 'Asia/Tokyo', offset: 'GMT+9', region: 'Asia' },
        { value: 'Australia/Sydney', label: 'Australia/Sydney', offset: 'GMT+11', region: 'Australia' },
      ];
    }
  }, []);

  // Filter timezones based on search
  const filteredTimezones = useMemo(() => {
    if (!search.trim()) return allTimezones;

    const searchLower = search.toLowerCase();
    return allTimezones.filter(
      (tz) =>
        tz.label.toLowerCase().includes(searchLower) ||
        tz.value.toLowerCase().includes(searchLower) ||
        tz.offset.toLowerCase().includes(searchLower)
    );
  }, [allTimezones, search]);

  // Group timezones by region
  const groupedTimezones = useMemo(() => {
    const groups: Record<string, typeof filteredTimezones> = {};

    filteredTimezones.forEach((tz) => {
      if (!groups[tz.region]) {
        groups[tz.region] = [];
      }
      groups[tz.region].push(tz);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredTimezones]);

  const selectedTimezone = allTimezones.find((tz) => tz.value === value);

  return (
    <div className="relative">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Timezone
      </label>

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg transition-colors ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200'
        } focus:outline-none focus:ring-2`}
      >
        <div className="flex items-center space-x-2 text-gray-900">
          <Globe className="w-4 h-4 text-gray-400" />
          <span>
            {selectedTimezone ? (
              <>
                {selectedTimezone.label}
                <span className="text-gray-500 ml-2 text-sm">{selectedTimezone.offset}</span>
              </>
            ) : (
              'Select timezone'
            )}
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error Message */}
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown Panel */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search timezones..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                  autoFocus
                />
              </div>
            </div>

            {/* Timezone List */}
            <div className="overflow-y-auto max-h-64">
              {filteredTimezones.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  No timezones found
                </div>
              ) : (
                groupedTimezones.map(([region, timezones]) => (
                  <div key={region}>
                    {/* Region Header */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        {region}
                      </h3>
                    </div>

                    {/* Timezones in Region */}
                    {timezones.map((tz) => (
                      <button
                        key={tz.value}
                        type="button"
                        onClick={() => {
                          onChange(tz.value);
                          setIsOpen(false);
                          setSearch('');
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-purple-50 transition-colors ${
                          value === tz.value ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900">{tz.label}</span>
                          <span className="text-sm text-gray-500">{tz.offset}</span>
                        </div>
                        {value === tz.value && (
                          <Check className="w-4 h-4 text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TimezoneSelector;
