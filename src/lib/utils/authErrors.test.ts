import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "@/lib/utils/authErrors";

describe("friendlyAuthError", () => {
  it("maps invalid credentials without revealing whether the email exists", () => {
    expect(friendlyAuthError("Invalid login credentials")).toBe(
      "That email or password doesn't look right. Please try again.",
    );
  });

  it("maps unconfirmed email", () => {
    expect(friendlyAuthError("Email not confirmed")).toBe(
      "Please confirm your email address before signing in — check your inbox for the link.",
    );
  });

  it("maps an already-registered email", () => {
    expect(friendlyAuthError("User already registered")).toBe(
      "An account with this email already exists. Try signing in instead.",
    );
  });

  it("maps a too-short password", () => {
    expect(friendlyAuthError("Password should be at least 8 characters")).toBe(
      "Your password is too short. Please use at least 8 characters.",
    );
  });

  it("maps a rate-limit error", () => {
    expect(friendlyAuthError("Email rate limit exceeded")).toBe(
      "Too many attempts. Please wait a moment and try again.",
    );
  });

  it("falls back to a generic message for anything unrecognized", () => {
    expect(friendlyAuthError("some unexpected supabase error")).toBe("Something went wrong. Please try again.");
  });
});
