
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS4</span>
            </div>
            <span className="text-xl font-bold">Online Scheduler 4</span>
          </div>
          <p className="text-gray-400 mb-6">
            The future of intelligent time management starts here
          </p>
          <div className="text-sm text-gray-500">
            Built with ❤️ using React, TypeScript & Tailwind CSS
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
