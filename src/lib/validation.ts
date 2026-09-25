export function isBlank(value: string) {
  return value.trim().length === 0;
}

export function isValidPostalCode(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(value.trim());
}

export function isValidPhone(value: string) {
  return /^[0-9+()\-\s]{7,20}$/.test(value.trim());
}

export function isValidCardNumber(value: string) {
  return /^\d{16}$/.test(value.replace(/\s/g, ""));
}

export function isValidExpiry(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const now = new Date();
  const expiryDate = new Date(year, month, 0);
  return expiryDate >= new Date(now.getFullYear(), now.getMonth(), 1);
}

export function isValidCvc(value: string) {
  return /^\d{3,4}$/.test(value.trim());
}

export function detectCardBrand(cardNumber: string) {
  const digits = cardNumber.replace(/\s/g, "");
  if (/^4/.test(digits)) return "Visa";
  if (/^5[1-5]/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "Amex";
  return "Card";
}
