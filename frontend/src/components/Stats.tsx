import { Building2, Calendar, Users } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: Building2,
      label: "Industries Supported",
      value: "5+"
    },
    {
      icon: Calendar,
      label: "Coming",
      value: "December 2025"
    },
    {
      icon: Users,
      label: "Early Access",
      value: "Open Now"
    }
  ];

  return (
    <section className="py-16 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-yellow-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-yellow-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;
