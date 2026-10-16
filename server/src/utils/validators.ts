export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  if (!/^\+?[\d\s()-]+$/.test(phone)) return false;
  const digitCount = phone.replace(/\D/g, '').length;
  return digitCount >= 7 && digitCount <= 15;
}
