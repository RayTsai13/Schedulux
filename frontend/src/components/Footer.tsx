import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Mail, Phone, MapPin, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
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
        toast.error('Failed to subscribe. Please try again.');
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
          email: newsletterEmail,
          listIds: [parseInt(import.meta.env.VITE_BREVO_NEWSLETTER_LIST_ID || '0')],
          updateEnabled: true
        })
      });

      // Brevo returns 201 for success, 204 if contact already exists
      if (brevoResponse.ok || brevoResponse.status === 204) {
        toast.success('Thank you for subscribing to our newsletter!');
        setNewsletterEmail('');
      } else {
        const brevoError = await brevoResponse.json();
        console.error('Brevo error:', brevoError);
        // Still show success since Web3Forms worked
        toast.success('Thank you for subscribing to our newsletter!');
        setNewsletterEmail('');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold">Schedulux</h3>
            </div>
            <p className="text-gray-400 leading-relaxed">
              The smart scheduling solution that helps small businesses save time, reduce no-shows, and deliver exceptional customer experiences. Built for modern businesses who value efficiency and growth.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Product</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Mobile Apps</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Use Cases</h4>
            <ul className="space-y-4 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Hair Salons</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Medical Practices</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fitness Studios</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Consultants</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Service Providers</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Contact</h4>
            <div className="space-y-4 text-gray-400">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-purple-400" />
                <span>hello@schedulux.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-purple-400" />
                <span>+1 (425) 236-5840</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-purple-400" />
                <span>Seattle, WA</span>
              </div>
            </div>
            
            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="text-sm font-semibold mb-3">Stay updated</h5>
              <form onSubmit={handleNewsletterSubmit}>
                <div className="flex">
                  <input
                    type="email"
                    name="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  />
                  <input type="hidden" name="subject" value="New Newsletter Subscription - Schedulux" />
                  <input type="hidden" name="from_name" value="Schedulux Landing Page" />
                  <input type="hidden" name="form_type" value="newsletter" />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-purple-600 to-yellow-500 hover:from-purple-700 hover:to-yellow-600 px-4 py-2 rounded-r-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '...' : 'Subscribe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2024 Schedulux. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;