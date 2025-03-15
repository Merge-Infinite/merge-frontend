import { useUser } from "@/hooks/useUser";
import { createContext, ReactNode, useContext } from "react";

// Define the shape of the auth context
interface AuthContextType {
  user: any;
  inventory: any;
  isLoading: boolean;
  error: any;
  refetchUser: () => Promise<any>;
  refetchInventory: () => Promise<any>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create props interface for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    user,
    inventory,
    refetchInventory,
    refetch: refetchUser,
    isLoading,
    error,
  } = useUser();

  // The value that will be provided to consumers of this context
  const value = {
    user,
    inventory,
    isLoading,
    error,
    refetchUser,
    refetchInventory,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create a custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
