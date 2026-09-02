import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "@/app/providers/authContext";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";

function toProfile(row: {
  id: string;
  full_name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}, email: string): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadProfile = useCallback(async (user: User) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, currency, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setProfileError(error.message);
      setProfile(null);
      return;
    }

    if (!data) {
      setProfileError(
        "Your profile hasn't been created yet. If you just signed up, the database trigger " +
          "that provisions it may not be set up — check the Phase 2 migration.",
      );
      setProfile(null);
      return;
    }

    setProfileError(null);
    setProfile(toProfile(data, user.email ?? ""));
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        loadProfile(nextSession.user);
      } else {
        setProfile(null);
        setProfileError(null);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadProfile(session.user);
    }
  }, [session, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        profileError,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
