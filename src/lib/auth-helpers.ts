const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string) {
  return EMAIL_RE.test(email.trim().toLowerCase());
}

export function mapAuthError(message: string) {
  const lower = message.toLowerCase();
  if (
    lower.includes('rate limit')
    || lower.includes('too many')
    || lower.includes('over_email_send_rate_limit')
    || lower.includes('over_request_rate_limit')
  ) {
    return 'Too many tries. Wait a minute and try again.';
  }
  if (lower.includes('invalid email')) {
    return "That email doesn't look right. Check for typos.";
  }
  return 'Something went wrong. Try again in a moment.';
}

export function isNoAccountError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes('user not found')
    || lower.includes('not found')
    || lower.includes('signups not allowed for otp')
    || lower.includes('user does not exist')
  );
}

export function profileNeedsSetup(profile: {
  allowance?: number | null;
  payday?: number | null;
} | null) {
  if (!profile) return true;
  const allowance = profile.allowance ?? 0;
  const payday = profile.payday ?? 0;
  if (allowance <= 0) return true;
  if (payday < 1 || payday > 31) return true;
  return false;
}