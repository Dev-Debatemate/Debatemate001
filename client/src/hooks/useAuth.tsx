import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import socketClient from "@/lib/socket";

interface User {
  id: number;
  username: string;
  email: string;
  displayName: string;
  level: number;
  points: number;
  debates: number;
  wins: number;
  losses: number;
  avatarId: number;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  logout: () => void;
  refreshUserData: (userId: number) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("debateUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Connect to WebSocket and authenticate
        socketClient.connect();
        socketClient.authenticate(parsedUser.id);
        
        // Fetch latest user data
        fetchUserData(parsedUser.id);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("debateUser");
      }
    }
  }, []);
  
  // Function to fetch user data
  const fetchUserData = async (userId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
      localStorage.setItem("debateUser", JSON.stringify(userData));
    } catch (error) {
      console.error("Error fetching user data:", error);
      // If we can't fetch user data, log out
      setUser(null);
      localStorage.removeItem("debateUser");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string; displayName: string }) => {
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Registration failed");
        }
        
        return await response.json();
      } catch (error) {
        // Check if the error contains specific messages
        if (error instanceof Error) {
          if (error.message.includes("Username already exists")) {
            throw new Error("Username already in use");
          }
          if (error.message.includes("Email already exists")) {
            throw new Error("Email address already in use");
          }
          throw error;
        }
        throw new Error("Registration failed. Please try again.");
      }
    },
    onSuccess: () => {
      navigate("/auth?action=login");
    }
  });
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(credentials)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Login failed");
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Login failed. Please check your credentials and try again.");
      }
    },
    onSuccess: (userData) => {
      setUser(userData);
      localStorage.setItem("debateUser", JSON.stringify(userData));
      
      // Connect to WebSocket and authenticate
      socketClient.connect();
      socketClient.authenticate(userData.id);
      
      navigate("/dashboard");
    }
  });
  
  const register = async (username: string, email: string, password: string, displayName: string) => {
    await registerMutation.mutateAsync({ username, email, password, displayName });
  };
  
  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  // Password reset request mutation
  const passwordResetRequestMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("POST", "/api/password-reset/request", data);
      return res.json();
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { email: string, token: string, password: string }) => {
      const res = await apiRequest("POST", "/api/password-reset/reset", data);
      return res.json();
    },
    onSuccess: () => {
      navigate("/auth?action=login");
    }
  });

  const requestPasswordReset = async (email: string) => {
    await passwordResetRequestMutation.mutateAsync({ email });
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    await resetPasswordMutation.mutateAsync({ 
      email, 
      token, 
      password: newPassword 
    });
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem("debateUser");
    socketClient.disconnect();
    
    // Clear cache
    queryClient.clear();
    
    navigate("/");
  };
  
  // Listen for user updates and update local state
  useEffect(() => {
    if (user) {
      const userId = user.id;
      // Subscribe to cache changes
      const unsubscribe = queryClient.getQueryCache().subscribe(() => {
        const queryData = queryClient.getQueryData([`/api/users/${userId}`]);
        if (queryData && JSON.stringify(queryData) !== JSON.stringify(user)) {
          console.log("User data updated:", queryData);
          setUser(queryData as User);
          localStorage.setItem("debateUser", JSON.stringify(queryData));
        }
      });
      
      // Return the unsubscribe function directly
      return unsubscribe;
    }
  }, [user]);
  
  // Only refresh user data when necessary, not on a timer
  // This prevents constant page refreshing
  useEffect(() => {
    if (user) {
      // Initial fetch when user is set
      fetchUserData(user.id);
    }
  }, [user?.id]);
  
  // Export function to refresh user data
  const updateUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem("debateUser", JSON.stringify(userData));
        return userData;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
    return null;
  };
  
  const value = {
    user,
    loading: isLoading || 
             registerMutation.isPending || 
             loginMutation.isPending ||
             passwordResetRequestMutation.isPending ||
             resetPasswordMutation.isPending,
    register,
    login,
    requestPasswordReset,
    resetPassword,
    logout,
    refreshUserData: updateUser,
    isAuthenticated: !!user
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
