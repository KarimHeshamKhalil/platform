export const FAKE_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_FAKE_EMAIL_DOMAIN || "platform.local";

export function usernameToEmail(username: string) {
  return `${username.toLowerCase().trim()}@${FAKE_EMAIL_DOMAIN}`;
}

export function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidPhone(phone: string) {
  // Egyptian phone: 01xxxxxxxxx (11 digits) or +201xxxxxxxxx
  return /^(01[0-9]{9}|\+201[0-9]{9})$/.test(phone.replace(/\s/g, ""));
}
