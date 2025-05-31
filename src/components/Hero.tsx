
import { ArrowRight, Calendar, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Welcome badge */}
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
            Welcome to the Future of Scheduling
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Hello World
            </span>
            <br />
            <span className="text-gray-800">Online Scheduler 4</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Experience the next generation of time management with our intelligent scheduling platform
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up animation-delay-400">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
              Start Scheduling
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-2">
              Watch Demo
            </Button>
          </div>

          {/* Feature icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-600">
            <div className="flex flex-col items-center p-6 bg-white/50 rounded-2xl backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:scale-105">
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="font-semibold text-gray-800">Smart Calendar</h3>
              <p className="text-sm text-gray-600 text-center">Intelligent scheduling</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/50 rounded-2xl backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:scale-105">
              <Clock className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="font-semibold text-gray-800">Time Optimization</h3>
              <p className="text-sm text-gray-600 text-center">Maximize productivity</p>
            </div>
            <div className="flex flex-col items-center p-6 bg-white/50 rounded-2xl backdrop-blur-sm hover:bg-white/70 transition-all duration-300 hover:scale-105">
              <Users className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="font-semibold text-gray-800">Team Collaboration</h3>
              <p className="text-sm text-gray-600 text-center">Seamless teamwork</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
