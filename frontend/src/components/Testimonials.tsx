import React from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Salon Owner',
      company: 'Bliss Beauty Salon',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'Schedulux transformed our booking system completely. No-shows dropped by 75% and our client satisfaction increased dramatically in just 3 months.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Fitness Studio Owner',
      company: 'FitCore Studios',
      image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'The automation features are incredible. I save 10 hours a week on scheduling, and my clients love the seamless booking experience.',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Dental Practice Manager',
      company: 'Bright Smiles Dental',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      content: 'Best investment we made for our practice. The calendar management and patient reminders have streamlined our entire operation.',
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Loved by
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-yellow-500"> thousands</span>
            {' '}of businesses
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what our customers have to say about Schedulux.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 relative group">
              <Quote className="w-10 h-10 text-purple-300 mb-4 group-hover:text-purple-400 transition-colors" />
              
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <p className="text-gray-700 mb-6 leading-relaxed italic">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center space-x-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                  <p className="text-purple-600 text-sm">{testimonial.role}</p>
                  <p className="text-gray-500 text-sm">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-2 bg-yellow-50 text-yellow-800 px-6 py-3 rounded-full">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="font-semibold">4.9/5 average rating</span>
            <span className="text-yellow-600">• 2,847 reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;