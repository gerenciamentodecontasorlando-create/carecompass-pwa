import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

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
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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
    if (Date.now() - parsed.ts > CACHE_MAX_AGE_MS) return null;
    return { user: parsed.user, profile: parsed.profile };
  } catch {
    return null;
  }
}

function clearAuthCache() {
  localStorage.removeItem(AUTH_CACHE_KEY);
}

function isNavigatorOnline(): boolean {
  return typeof navigator === "undefined" ? true : navigator.onLine;
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
  const cached = loadAuthCache();
  const [user, setUser] = useState<User | null>(cached?.user ?? null);
  const [profile, setProfile] = useState<Profile | null>(cached?.profile ?? null);
  const [loading, setLoading] = useState(!cached);
  const explicitSignOutRef = useRef(false);

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
        const cachedNow = loadAuthCache();
        if (cachedNow?.user) saveAuthCache(cachedNow.user, p);
      }
    } catch (e) {
      console.warn("Could not fetch profile (possibly offline):", e);
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          // Only clear if it was an explicit sign-out, not a network failure
          if (explicitSignOutRef.current) {
            setUser(null);
            setProfile(null);
            clearAuthCache();
            explicitSignOutRef.current = false;
          }
          // If not explicit and we're offline, keep cached state
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        if (currentUser) {
          setUser(currentUser);
          setTimeout(() => fetchProfile(currentUser.id), 0);
        }
        // If currentUser is null but event is not SIGNED_OUT (e.g. TOKEN_REFRESHED failure),
        // keep cached state when offline
        setLoading(false);
      }
    );

    // Initial session check
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist cache whenever user+profile are available
  useEffect(() => {
    if (user && profile) {
      saveAuthCache(user, profile);
    }
  }, [user, profile]);

  // When coming back online, try to refresh session silently
  useEffect(() => {
    const handleOnline = () => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        }
      }).catch(() => {});
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signOut = async () => {
    explicitSignOutRef.current = true;
    clearAuthCache();
    setUser(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch { /* offline */ }
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
