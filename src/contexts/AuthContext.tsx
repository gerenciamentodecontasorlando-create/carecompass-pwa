import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface Profile {
  id: string;
  user_id: string;
  clinic_id: string;
  full_name: string;
  specialty: string;
  registration_number: string;
  phone: string;
  avatar_url: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  clinicId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AUTH_CACHE_KEY = "clinicapro-auth-cache";

function saveAuthCache(user: User, profile: Profile) {
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, profile, ts: Date.now() }));
  } catch { /* quota exceeded */ }
}

function loadAuthCache(): { user: User; profile: Profile } | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cache valid for 30 days
    if (Date.now() - parsed.ts > 30 * 24 * 60 * 60 * 1000) return null;
    return { user: parsed.user, profile: parsed.profile };
  } catch {
    return null;
  }
}

function clearAuthCache() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  clinicId: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus();
  
  // Initialize from cache immediately for faster/offline load
  const cached = loadAuthCache();
  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null);
  const [loading, setLoading] = useState(!cached); // Not loading if we have cache

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        const p = data as Profile;
        setProfile(p);
        // Update cache with fresh profile
        const currentUser = user;
        if (currentUser) saveAuthCache(currentUser, p);
      }
    } catch (e) {
      console.warn("Could not fetch profile (possibly offline):", e);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setTimeout(() => fetchProfile(currentUser.id), 0);
        } else if (event === "SIGNED_OUT") {
          setProfile(null);
          clearAuthCache();
        }
        setLoading(false);
      }
    );

    // Try to get session from Supabase (works online)
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        fetchProfile(currentUser.id);
      } else if (!cached) {
        // No session and no cache = truly not logged in
        setUser(null);
        setProfile(null);
      }
      // If we have cache but no session (offline), keep cached user
      setLoading(false);
    }).catch(() => {
      // Network error — rely on cached data
      if (cached) {
        setUser(cached.user);
        setProfile(cached.profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save to cache whenever both user and profile are available
  useEffect(() => {
    if (user && profile) {
      saveAuthCache(user, profile);
    }
  }, [user, profile]);

  const signOut = async () => {
    clearAuthCache();
    try {
      await supabase.auth.signOut();
    } catch { /* offline */ }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        clinicId: profile?.clinic_id ?? null,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
