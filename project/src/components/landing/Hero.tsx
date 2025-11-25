import React, { useEffect, useRef, useState } from "react";
import { Menu, X, Calendar, ShoppingBag, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface HeroProps {
  onAuthClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAuthClick }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!isMenuOpen) return;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (toggleRef.current && toggleRef.current.contains(target)) return;
      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      {/* Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-30 py-3 sm:py-4 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left - Brand Name */}
            <div className="shrink-0">
              <Link to="/" className="text-xl sm:text-2xl font-semibold text-black hover:opacity-80 transition-opacity tracking-tight">
                TechCollab
              </Link>
            </div>

            {/* Center - Nav (desktop only) */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/signup"
                className="font-medium text-gray-900 hover:text-black transition-colors"
              >
                Freelancer
              </Link>
              <Link
                to="/signup"
                className="font-medium text-gray-900 hover:text-black transition-colors"
              >
                Events
              </Link>
              <Link
                to="/signup"
                className="font-medium text-gray-900 hover:text-black transition-colors"
              >
                Communities
              </Link>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile: icon buttons */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={() => setIsMenuOpen((v) => !v)}
                  ref={toggleRef}
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                  aria-label="Open menu"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>

              {/* Desktop: text buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login">
                  <button className="px-4 py-2 font-medium text-gray-900 hover:text-black transition-colors">
                    Log in
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
                    Sign up
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {isMenuOpen && (
            <div ref={menuRef} className="md:hidden mt-3 rounded-lg border border-gray-200 bg-white shadow-lg divide-y divide-gray-100">
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50">
                <ShoppingBag className="h-5 w-5 text-black" />
                <span>Freelancer</span>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50">
                <Calendar className="h-5 w-5 text-black" />
                <span>Events</span>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-800 hover:bg-gray-50">
                <Users className="h-5 w-5 text-black" />
                <span>Communities</span>
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero Content - Column Layout with rounded #f2f2f2 background */}
      <div className="relative pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#f2f2f2] rounded-3xl">
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">

              {/* Content - Top */}
              <div className="w-full max-w-4xl text-center">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium tracking-tight text-black leading-tight">
                  The app that works for{" "}
                  <span className="font-semibold">freelancers</span>
                </h1>

                <p className="mt-6 text-base sm:text-lg font-normal text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  Showcase your work, attend events, and connect with tech communities.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-lg font-medium text-base sm:text-lg hover:opacity-90 transition-opacity w-full sm:w-auto"
                  >
                    Start Earning
                  </button>
                </div>
              </div>

              {/* Hero Image - Bottom */}
              <div className="w-full max-w-5xl mt-8">
                <div className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src="/images/techcollabhero.webp"
                    alt="TechCollab Platform"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
