import { useEffect, useState, useCallback } from "react";
import type { User } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged, signInWithGoogle, signOut as signOutFirebase } from "@/lib/firebase/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(auth.currentUser ?? null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onAuthStateChanged((u: User | null) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await signOutFirebase();
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, signIn, signOut } as const;
}
