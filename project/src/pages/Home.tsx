import { useState } from "react";
import Hero from "../components/landing/Hero";
import AuthModal from "../components/auth/AuthModal";

const Home = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <div className="relative">
      <Hero onAuthClick={() => setShowAuthModal(true)} />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Home;
