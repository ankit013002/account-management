export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export interface PasswordStrength {
  level: StrengthLevel;
  label: string;
  color: string;
  width: string;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: "", color: "", width: "0%" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const level = Math.min(4, Math.max(1, Math.ceil(score / 1.25))) as StrengthLevel;

  const map: Record<StrengthLevel, Omit<PasswordStrength, "level">> = {
    0: { label: "", color: "", width: "0%" },
    1: { label: "Weak", color: "bg-red-500", width: "25%" },
    2: { label: "Fair", color: "bg-amber-500", width: "50%" },
    3: { label: "Good", color: "bg-yellow-400", width: "75%" },
    4: { label: "Strong", color: "bg-emerald-500", width: "100%" },
  };

  return { level, ...map[level] };
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const AMBIGUOUS = new Set(["0", "O", "o", "1", "l", "I", "|"]);

export interface PasswordGenerationOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  avoidAmbiguous?: boolean;
}

function pick(charset: string): string {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return charset[value[0] % charset.length];
}

function shuffle(chars: string[]): string {
  const result = [...chars];
  for (let i = result.length - 1; i > 0; i--) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    const j = value[0] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join("");
}

function cleanCharset(charset: string, avoidAmbiguous: boolean): string {
  if (!avoidAmbiguous) return charset;
  return [...charset].filter((char) => !AMBIGUOUS.has(char)).join("");
}

export function generatePassword(
  length = 20,
  options: PasswordGenerationOptions = {},
): string {
  const settings = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: false,
    ...options,
  };
  const requiredSets = [
    settings.uppercase && cleanCharset(UPPER, settings.avoidAmbiguous),
    settings.lowercase && cleanCharset(LOWER, settings.avoidAmbiguous),
    settings.numbers && cleanCharset(DIGITS, settings.avoidAmbiguous),
    settings.symbols && cleanCharset(SYMBOLS, settings.avoidAmbiguous),
  ].filter((set): set is string => Boolean(set));

  const charset = requiredSets.join("");
  if (!charset) return "";

  const safeLength = Math.max(requiredSets.length, Math.min(128, length));
  const result = requiredSets.map((set) => pick(set));
  while (result.length < safeLength) {
    result.push(pick(charset));
  }

  return shuffle(result);
}
