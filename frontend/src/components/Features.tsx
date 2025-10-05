import { Calendar, Users, Clock, BarChart3, Bell, MapPin } from 'lucide-react';

const Features = () => {
  const handleScrollToHero = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const features = [
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description: "Intelligent calendar management with automated conflict detection and flexible booking rules."
    },
    {
      icon: MapPin,
      title: "Multi-Location Support",
      description: "Manage multiple business locations with independent schedules and services from one dashboard."
    },
    {
      icon: Users,
      title: "Client Management",
      description: "Keep track of your clients, their preferences, and appointment history all in one place."
    },
    {
      icon: Bell,
      title: "Automated Reminders",
      description: "Reduce no-shows with automatic email and SMS reminders for upcoming appointments."
    },
    {
      icon: Clock,
      title: "Flexible Hours",
      description: "Set custom availability patterns, override with special hours, and handle exceptions effortlessly."
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track bookings, revenue, popular services, and business performance with detailed insights."
    }
  ];

  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything you need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-yellow-500"> succeed</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed specifically for small businesses to streamline scheduling and grow revenue.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group p-8 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 bg-gradient-to-r from-purple-100 to-yellow-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-purple-600 to-yellow-500 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-6">Ready to transform your business?</h3>
            <p className="text-purple-100 mb-8 max-w-3xl mx-auto text-lg">
              Join the waitlist for Schedulux. Get early access and special founder pricing when we go live.
            </p>
            <div className="flex justify-center">
              <button
                onClick={handleScrollToHero}
                className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 text-lg"
              >
                Join Early Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;