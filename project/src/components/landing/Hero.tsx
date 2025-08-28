import React, { useEffect, useRef, useState } from "react";
import { ArrowRight,ArrowUpRight , Code, Users, MessageSquare, Sun, Moon, Menu, X, Calendar, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import Logo from "../ui/Logo";
import Button from "../ui/Button";

interface HeroProps {
  onAuthClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAuthClick }) => {
  const navigate = useNavigate();
  const { toggleDarkMode, isDarkMode } = useTheme();
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
      },
    },
  };

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <section className="relative min-h-screen bg-[#fafafa] dark:bg-[#232323] overflow-hidden">
      {/* Header Navigation - Centered */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-30 py-2 sm:py-3 bg-[#fafafa] dark:bg-[#232323]"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Left - Logo */}
            <div className="shrink-0">
              <Logo width={120} height={38} className="hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Center - Nav (desktop only) */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/signup"
                className="font-medium text-gray-900 dark:text-dark-text hover:text-green-600 dark:hover:text-dark-button transition-colors"
              >
                MarketPlace
              </Link>
              <Link
                to="/signup"
                className="font-medium text-gray-900 dark:text-dark-text hover:text-green-600 dark:hover:text-dark-button transition-colors"
              >
                Events
              </Link>
              <Link
                to="/signup"
                className="font-medium text-gray-900 dark:text-dark-text hover:text-green-600 dark:hover:text-dark-button transition-colors"
              >
                Community
              </Link>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile: icon buttons */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 bg-transparent rounded-md text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-buttonBg/10 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setIsMenuOpen((v) => !v)}
                  ref={toggleRef}
                  className="p-2 rounded-md text-gray-700 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-buttonBg/20"
                  aria-label="Open menu"
                >
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>

              {/* Desktop: text buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="secondary" size="md">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" size="md">Create Profile</Button> 
                </Link>
                <button
                  onClick={toggleDarkMode}
                  className="p-2 bg-transparent rounded-md text-gray-700 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-buttonBg/10 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {isMenuOpen && (
            <div ref={menuRef} className="md:hidden mt-3 rounded-lg border border-gray-200 dark:border-dark-buttonBg bg-white dark:bg-[#1b1b1b] shadow-lg divide-y divide-gray-100 dark:divide-dark-buttonBg">
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-800 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-buttonBg/20">
                <ShoppingBag className="h-5 w-5 text-green-600" />
                <span>Marketplace</span>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-800 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-buttonBg/20">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Events</span>
              </Link>
              <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-800 dark:text-dark-text hover:bg-gray-50 dark:hover:bg-dark-buttonBg/20">
                <Users className="h-5 w-5 text-green-600" />
                <span>Community</span>
              </Link>
            </div>
          )}
        </div>
      </motion.header>

      {/* Background dot pattern - REMOVED */}

      <div className="relative container mx-auto px-4 pt-12 sm:pt-8">
       


        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          className="absolute right-32 bottom-32 hidden md:block"
        >
          <div className="bg-white dark:bg-dark-buttonBg/20 rounded-lg shadow-lg p-4 rotate-[4deg] border dark:border-dark-buttonBg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-dark-button/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-dark-button"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-dark-text">Projects</p>
                <p className="text-gray-500 dark:text-gray-400">View all tasks</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center justify-center min-h-screen py-20 sm:py-24 text-center relative z-10 mt-2 sm:mt-4"
        >
          <motion.h1
            variants={itemVariants}
            className="max-w-4xl mx-auto text-4xl sm:text-6xl lg:text-6xl font-light tracking-tight text-black dark:text-dark-text [text-wrap:balance]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            The All-in-One Platform for{" "}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="font-normal italic"
            >
              Freelancers
            </motion.span>
            <span className="font-light">, </span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.6 }}
              className="font-normal italic"
            >
              Events
            </motion.span>
            <span className="font-light">, and </span>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="font-normal italic"
            >
              Communities
            </motion.span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-gray-600 dark:text-gray-300 mt-4 sm:mt-6 max-w-2xl mx-auto font-normal text-base sm:text-xl px-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Showcase your work, find paid gigs, join tech communities
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-8 sm:mt-10 flex flex-col items-center w-full max-w-md mx-auto"
          >
            <div className="flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate("/signup")}
                  rightIcon={<ArrowUpRight className="w-5 h-5" />}
                >
                  Get Started
                </Button>
              </motion.div>
            </div>
            <motion.p
              variants={itemVariants}
              className="text-sm text-gray-500 dark:text-gray-400 mt-3 sm:mt-4 italic"
            >
              Join our community today and start collaborating!
            </motion.p>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-7xl px-4"
          >
            {/* Feature cards with motion */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-dark-buttonBg/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-dark-button/20 rounded-2xl flex items-center justify-center mb-6">
                <Code className="w-8 h-8 text-green-600 dark:text-dark-button" />
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-3">
                  Freelance Marketplace
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Find exciting gigs, showcase your portfolio, and connect with clients. 
                  From web development to UI/UX design, your next opportunity awaits.
                </p>
              </div>
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-buttonBg/20">
                <img
                  src="https://res.cloudinary.com/dtmo3evjx/image/upload/v1748258394/Freelancer-amico_k9wiqy.png"
                  alt="Freelance Marketplace"
                  className="w-full h-full object-contain p-4"
                />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-dark-buttonBg/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-dark-button/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-green-600 dark:text-dark-button" />
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-3">
                  Tech Communities
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Join specialized tech communities, engage in real-time discussions, 
                  and collaborate with fellow developers in your favorite tech stacks.
                </p>
              </div>
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-buttonBg/20">
                <img
                  src="https://res.cloudinary.com/dtmo3evjx/image/upload/v1748258395/Group_Chat-bro_wott7y.png"
                  alt="Tech Communities"
                  className="w-full h-full object-contain p-4"
                />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -10 }}
              className="bg-white dark:bg-dark-buttonBg/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-dark-button/20 rounded-2xl flex items-center justify-center mb-6">
                <MessageSquare className="w-8 h-8 text-green-600 dark:text-dark-button" />
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-3">
                  Live Events & Learning
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Attend virtual hackathons, join interactive workshops, and participate 
                  in tech conferences. Learn, network, and grow your skills together.
                </p>
              </div>
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-gray-50 dark:bg-dark-buttonBg/20">
                <img
                  src="https://res.cloudinary.com/dtmo3evjx/image/upload/v1748258395/Events-bro_f5ly1w.png"
                  alt="Live Events & Learning"
                  className="w-full h-full object-contain p-4"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
