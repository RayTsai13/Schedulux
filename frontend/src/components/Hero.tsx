import React, { useState } from 'react';
import { Calendar, Star, Mail } from 'lucide-react';
import { toast } from 'sonner';

const Hero = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send to Web3Forms
      const formData = new FormData(e.target as HTMLFormElement);
      formData.append('access_key', import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '');

      const web3formsResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      const web3formsData = await web3formsResponse.json();

      if (!web3formsData.success) {
        console.error('Web3Forms error:', web3formsData);
        toast.error('Something went wrong. Please try again.');
        return;
      }

      // Send to Brevo (SendinBlue)
      const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': import.meta.env.VITE_BREVO_API_KEY || ''
        },
        body: JSON.stringify({
          email: email,
          listIds: [parseInt(import.meta.env.VITE_BREVO_EARLY_ACCESS_LIST_ID || '0')],
          updateEnabled: true
        })
      });

      // Brevo returns 201 for success, 204 if contact already exists
      if (brevoResponse.ok || brevoResponse.status === 204) {
        toast.success('Thanks for signing up! We\'ll keep you updated on our launch.');
        setEmail('');
      } else {
        const brevoError = await brevoResponse.json();
        console.error('Brevo error:', brevoError);
        // Still show success since Web3Forms worked
        toast.success('Thanks for signing up! We\'ll keep you updated on our launch.');
        setEmail('');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Schedule
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-yellow-500"> smarter</span>,
              grow faster
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
              The all-in-one scheduling solution that helps small businesses save time, reduce no-shows, 
              and deliver exceptional customer experiences.
            </p>
            
            <div className="space-y-6">
              {/* Email Signup Form */}
              <form 
                onSubmit={handleEmailSubmit}
                className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
              >
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Get Early Access
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Be the first to know when we launch. No spam, unsubscribe anytime.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    <input type="hidden" name="subject" value="New Early Access Signup - Schedulux" />
                    <input type="hidden" name="from_name" value="Schedulux Landing Page" />
                    <input type="hidden" name="form_type" value="early_access" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Signing up...</span>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Notify Me</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
              
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