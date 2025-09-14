import React from 'react';
import { Calendar, Clock, Users, BarChart3, Smartphone, Shield } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description: 'AI-powered scheduling that automatically finds the best times for everyone.',
      color: 'purple'
    },
    {
      icon: Clock,
      title: 'Automated Reminders',
      description: 'Reduce no-shows by 80% with smart SMS and email reminders.',
      color: 'yellow'
    },
    {
      icon: Users,
      title: 'Team Management',
      description: 'Manage multiple staff schedules and resources from one dashboard.',
      color: 'purple'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track performance, identify trends, and optimize your business.',
      color: 'yellow'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Full-featured mobile apps for you and your customers.',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee.',
      color: 'yellow'
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClasses = feature.color === 'purple' 
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 group-hover:from-purple-600 group-hover:to-purple-700' 
              : 'bg-gradient-to-r from-yellow-400 to-yellow-500 group-hover:from-yellow-500 group-hover:to-yellow-600';
            
            return (
              <div 
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-2"
              >
                <div className={`w-14 h-14 ${colorClasses} rounded-xl flex items-center justify-center mb-6 transition-all duration-300`}>
                  <IconComponent className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors">
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
              Join thousands of businesses already using Schedulux to streamline their scheduling, reduce no-shows, and grow their customer base. Get started in minutes with our easy setup process.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 text-lg">
                Get Started Free
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-purple-600 transition-all duration-200 text-lg">
                Schedule a Demo
              </button>
            </div>
            
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-8 border-t border-purple-300">
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">5 min</div>
                <div className="text-purple-100">Setup time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">24/7</div>
                <div className="text-purple-100">Support included</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-2">30 days</div>
                <div className="text-purple-100">Money-back guarantee</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;