import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface User {
  _id?: string; // Changed from id to _id to match backend
  id?: string; // Keep for backward compatibility
  email: string;
  name: string;
  picture?: string;
  bio?: string;
  token?: string; // Added token field
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  requireAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);
  const login = (userData: any) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem("user", JSON.stringify(userData));
      // Store token separately for easier access
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  // Enhanced setUser to also persist to localStorage
  const setUserWithPersistence = (userData: User | null) => {
    try {
      setUser(userData);
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
        if (userData.token) {
          localStorage.setItem("token", userData.token);
        }
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error updating user data:", error);
      setUser(userData); // Fallback to just state update
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      navigate("/");
      return false;
    }
    return true;
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: setUserWithPersistence,
        isAuthenticated,
        isLoading,
        login,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
