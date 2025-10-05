const Features = () => {
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

        {/* Call to Action */}
        <div className="text-center mt-20">
          <div className="bg-gradient-to-r from-purple-600 to-yellow-500 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-6">Ready to transform your business?</h3>
            <p className="text-purple-100 mb-8 max-w-3xl mx-auto text-lg">
              Join the waitlist for Schedulux. Get early access and special founder pricing when we go live.
            </p>
            <div className="flex justify-center">
              <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 text-lg">
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