import React from "react";
import { ArrowRight, Code, Users, MessageSquare, Sun, Moon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import Logo from "../ui/Logo";

interface HeroProps {
  onAuthClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onAuthClick }) => {
  const navigate = useNavigate();
  const { toggleDarkMode, isDarkMode } = useTheme();

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
        className="absolute top-0 left-0 right-0 z-20 py-6"
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center relative">
            {/* Left side - Logo (positioned absolutely) */}
            <div className="absolute left-0 w-32">
              <Logo width={120} height={38} className="hover:scale-105 transition-transform duration-300" />
            </div>

            {/* Center Navigation Links */}
            <div className="flex items-center space-x-8">
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

            {/* Right side - Auth Buttons and Theme Toggle (positioned absolutely) */}
            <div className="absolute right-0 flex items-center space-x-4">
              <Link
                to="/login"
                className="font-medium text-gray-900 dark:text-dark-text hover:text-green-600 dark:hover:text-dark-button transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-md font-medium text-white bg-green-500 dark:bg-dark-button hover:bg-green-600 dark:hover:bg-dark-button/90 transition-colors shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all"
              >
                Create Profile
              </Link>
              <button
                onClick={toggleDarkMode}
                className="p-3 rounded-full bg-gray-100 dark:bg-dark-buttonBg text-gray-600 dark:text-dark-text hover:bg-gray-200 dark:hover:bg-dark-buttonBg/80 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Background dot pattern - REMOVED */}

      <div className="relative container mx-auto px-4">
        {/* Floating UI Elements */}
        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          className="absolute left-10 top-32"
        >
          <div className="bg-white dark:bg-dark-buttonBg/20 rounded-lg shadow-lg p-4 rotate-[-6deg] border dark:border-dark-buttonBg">
            <div className="w-48 h-32 bg-green-50 dark:bg-dark-button/10 rounded-md p-3">
              <p className="text-sm text-gray-700 dark:text-dark-text font-medium">
                Connect with top tech talent and collaborate on exciting
                projects
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          className="absolute right-10 top-40"
        >
          <div className="bg-white dark:bg-dark-buttonBg/20 rounded-lg shadow-lg p-3 rotate-[6deg] border dark:border-dark-buttonBg">
            <div className="flex items-center space-x-3 w-48">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-dark-button/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-green-600 dark:text-dark-button"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-dark-text">
                Quick Response
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={floatingVariants}
          initial="initial"
          animate="animate"
          className="absolute right-32 bottom-32"
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
          className="flex flex-col items-center justify-center min-h-screen py-20 text-center relative z-10 mt-8"
        >
          <motion.h1
            variants={itemVariants}
            className="max-w-4xl mx-auto text-[2.75rem] sm:text-6xl lg:text-7xl font-light tracking-tight text-black dark:text-dark-text [text-wrap:balance]"
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
            className="text-gray-600 dark:text-gray-300 mt-6 max-w-2xl mx-auto font-light text-lg sm:text-xl"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Showcase your work, find paid gigs, join vibrant communities and
            explore the latest events — all in one powerful builder-first
            platform
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col items-center w-full max-w-md mx-auto"
          >
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/signup")}
                className="px-8 py-3 bg-green-500 dark:bg-dark-button text-white rounded-full font-medium hover:bg-green-600 dark:hover:bg-dark-button/90 transition-colors flex items-center gap-2 text-lg"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
            <motion.p
              variants={itemVariants}
              className="text-sm text-gray-500 dark:text-gray-400 mt-4"
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
