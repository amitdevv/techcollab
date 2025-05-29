import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../contexts/AuthContext";
import * as authApi from "../../services/authApi";
import toast from "react-hot-toast";

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response: { access_token: string }) => {
      setIsLoading(true);
      try {
        const authResponse = await authApi.loginWithGoogle(response.access_token);
        login(authResponse.user);
        toast.success("Account created successfully!");
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Google sign up failed:", error);
        toast.error("Failed to sign up with Google. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      toast.error("Google sign up was cancelled or failed");
      setIsLoading(false);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-[#232323] dark:via-[#232323] dark:to-[#232323] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-dark-buttonBg/20 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">
            Create Account
          </h2>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            googleLogin();
          }}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 dark:border-dark-buttonBg rounded-xl text-base font-medium text-gray-700 dark:text-dark-text bg-white dark:bg-dark-buttonBg/20 hover:bg-gray-50 dark:hover:bg-dark-buttonBg/30 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 dark:border-dark-button"></div>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {isLoading ? "Creating account..." : "Continue with Google"}
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-green-600 dark:text-dark-button hover:text-green-500 dark:hover:text-dark-button/90"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
