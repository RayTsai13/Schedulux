import React from 'react';
import { Calendar, ArrowRight, Star } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-yellow-50 min-h-screen flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-20 right-20 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="w-4 h-4 fill-current" />
              <span>Trusted by thousands of businesses</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Schedule
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-yellow-500"> smarter</span>,
              grow faster
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
              The all-in-one scheduling solution that helps small businesses save time, reduce no-shows, 
              and deliver exceptional customer experiences.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-2">
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button className="bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-700 hover:text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-200 hover:shadow-lg">
                Learn More
              </button>
            </div>
            
            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">A</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-semibold">B</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-400 to-yellow-500 flex items-center justify-center text-white font-semibold">C</div>
                </div>
                <span className="text-sm text-gray-600">Loved by business owners everywhere</span>
              </div>
            </div>
          </div>
          
          {/* Right column - Visual */}
          <div className="relative">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Schedulux</h3>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-yellow-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">Sarah's Salon Appointment</span>
                    <span className="text-sm text-purple-600 bg-purple-100 px-2 py-1 rounded">Today</span>
                  </div>
                  <p className="text-gray-600 text-sm">2:00 PM - 3:30 PM</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">Team Meeting</span>
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">Tomorrow</span>
                  </div>
                  <p className="text-gray-600 text-sm">10:00 AM - 11:00 AM</p>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-purple-50 p-4 rounded-xl border border-yellow-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">Client Consultation</span>
                    <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Friday</span>
                  </div>
                  <p className="text-gray-600 text-sm">4:00 PM - 5:00 PM</p>
                </div>
              </div>
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-2xl">📅</span>
            </div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-purple-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <span className="text-xl">⏰</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;