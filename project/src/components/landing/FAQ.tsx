import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";

const faqs = [
  {
    question: "How do I get started as a freelancer?",
    answer: "Getting started is easy! Create your profile, showcase your portfolio, and start browsing available gigs. You can also set up your expertise, preferred tech stack, and hourly rates to attract the right clients.",
  },
  {
    question: "What types of events are available?",
    answer: "We host a variety of tech events including virtual hackathons, coding workshops, tech conferences, and networking meetups. You can participate in both online and in-person events, with many offering certificates and prizes.",
  },
  {
    question: "How does the community feature work?",
    answer: "Our community feature lets you join specialized tech groups based on your interests. You can participate in real-time discussions, share knowledge, ask questions, and collaborate with fellow developers in your preferred tech stack.",
  },
  {
    question: "Is there a fee to join the platform?",
    answer: "Basic membership is completely free! You can create a profile, join communities, and participate in events at no cost. We have premium plans available for additional features like priority job matching and exclusive event access.",
  },
  {
    question: "How do you ensure quality in the marketplace?",
    answer: "We maintain high standards through our verification process, skill assessments, and review system. All freelancers are vetted, and clients are verified to ensure a trusted marketplace environment.",
  },
  {
    question: "Can I organize my own tech event?",
    answer: "Absolutely! Community leaders and verified members can organize and host their own events. We provide tools and support to help you create successful virtual or in-person tech events.",
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-32 bg-gradient-to-b from-green-50/50 to-white dark:from-[#232323] dark:to-[#232323]">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-dark-text mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Everything you need to know about our platform
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-green-100 dark:border-dark-buttonBg rounded-xl overflow-hidden bg-white/80 dark:bg-dark-buttonBg/10 backdrop-blur-sm shadow-sm"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left transition-colors hover:bg-green-50/50 dark:hover:bg-dark-buttonBg/20"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-medium text-gray-900 dark:text-dark-text">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDown className="h-5 w-5 text-green-600 dark:text-dark-button flex-shrink-0" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ 
                      height: "auto", 
                      opacity: 1,
                      transition: {
                        height: { duration: 0.3, ease: "easeOut" },
                        opacity: { duration: 0.2, delay: 0.1 }
                      }
                    }}
                    exit={{ 
                      height: 0, 
                      opacity: 0,
                      transition: {
                        height: { duration: 0.3, ease: "easeIn" },
                        opacity: { duration: 0.2 }
                      }
                    }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 border-t border-green-100 dark:border-dark-buttonBg">
                      <div className="pt-4">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Still have questions? We're here to help!
          </p>
          <Button variant="secondary" size="lg">
            Contact Support
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FAQ; 