export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "That email or password doesn't look right. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in — check your inbox for the link.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password should be at least")) {
    return "Your password is too short. Please use at least 8 characters.";
  }
  if (lower.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (lower.includes("session missing") || lower.includes("session expired") || lower.includes("session not found")) {
    return "Your session expired before this could finish. Please request a new reset link and try again.";
  }
  if (lower.includes("should be different from the old password")) {
    return "Please choose a password different from your current one.";
  }
  if (lower.includes("expired") || lower.includes("invalid or has expired") || lower.includes("otp_expired")) {
    return "This link is no longer valid. Please request a new one.";
  }

  return "Something went wrong. Please try again.";
}
