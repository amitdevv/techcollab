import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../../contexts/AuthContext";
import ProfileSetupModal from "./ProfileSetupModal";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialUserData, setInitialUserData] = useState<{
    email: string;
    name: string;
    picture: string;
  } | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const decoded: any = jwtDecode(credentialResponse.credential);
      const userData = {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      };

      // Check if user already exists in backend
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...userData,
          authProvider: "google",
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // If user already has username and bio, they're fully registered
        if (data.user.username && data.user.bio) {
          setUser({ ...data.user, token: data.token });
          onClose();
          // AuthContext will handle navigation to /profile/username
        } else {
          // User exists but needs to complete profile setup (new user or incomplete profile)
          setInitialUserData(userData);
          onClose();
          // Show profile setup modal after a short delay to ensure smooth transition
          setTimeout(() => {
            setShowProfileSetup(true);
          }, 100);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to authenticate");
      }
    } catch (error) {
      setError("Failed to process Google login. Please try again.");
      console.error("Error processing Google login:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome</h2>
            <p className="mt-1 text-sm text-gray-500">Sign in with Google</p>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="w-full">
              {isLoading ? (
                <div className="flex items-center justify-center py-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <span className="ml-2 text-sm text-gray-600">
                    Signing you in...
                  </span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError("Google login failed. Please try again.");
                  }}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showProfileSetup && initialUserData && (
        <ProfileSetupModal
          isOpen={showProfileSetup}
          onClose={() => setShowProfileSetup(false)}
          initialEmail={initialUserData.email}
          initialName={initialUserData.name}
          initialPicture={initialUserData.picture}
        />
      )}
    </>
  );
};

export default AuthModal;
