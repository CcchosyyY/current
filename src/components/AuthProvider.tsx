"use client";

import { AuthContext, useAuthState } from "@/lib/hooks/useAuth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}
