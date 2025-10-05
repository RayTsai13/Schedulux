import { UserPlus, Settings, Zap } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "1",
      title: "Sign Up & Set Up",
      description: "Create your account and add your business locations, services, and team members in minutes."
    },
    {
      icon: Settings,
      number: "2",
      title: "Configure Your Schedule",
      description: "Set your availability, business hours, and booking rules. Customize everything to fit your workflow."
    },
    {
      icon: Zap,
      number: "3",
      title: "Start Accepting Bookings",
      description: "Share your booking link and let clients schedule appointments 24/7. Get instant notifications."
    }
  ];

  return (
    <section className="py-32 bg-gradient-to-br from-purple-50 via-white to-yellow-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Get started in
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-yellow-500"> three simple steps</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            No complicated setup. No technical knowledge required. Just smart scheduling that works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line (hidden on mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-purple-300 to-yellow-300"></div>
                )}

                <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Number Badge */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-yellow-100 rounded-xl flex items-center justify-center mb-6 mt-4">
                    <Icon className="w-8 h-8 text-purple-600" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
