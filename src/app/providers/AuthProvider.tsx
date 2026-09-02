import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "@/app/providers/authContext";
import { supabase } from "@/lib/supabase/client";
import type { Profile } from "@/types";

function toProfile(row: {
  id: string;
  full_name: string;
  currency: string;
  allocation_target: number;
  created_at: string;
  updated_at: string;
}, email: string): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email,
    currency: row.currency,
    allocationTarget: row.allocation_target,
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
      .select("id, full_name, currency, allocation_target, created_at, updated_at")
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

    // Gates rendering on the profile fetch completing, not just the session — otherwise a
    // freshly-signed-in page (e.g. right after signup) can render one frame with `profile`
    // still null and fall back to less-specific data (like the greeting using the email
    // prefix instead of the real name) before the fetch resolves a moment later.
    async function syncSession(nextSession: Session | null) {
      setSession(nextSession);
      if (nextSession?.user) {
        await loadProfile(nextSession.user);
      } else {
        setProfile(null);
        setProfileError(null);
      }
      if (active) setLoading(false);
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      syncSession(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION") return; // already handled by getSession() above
      if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // Background updates to an already-active session — update quietly, no full-screen gate.
        setSession(nextSession);
        return;
      }
      // A real transition (SIGNED_IN, SIGNED_OUT, ...): gate on the profile fetch, same as above.
      setLoading(true);
      syncSession(nextSession);
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
