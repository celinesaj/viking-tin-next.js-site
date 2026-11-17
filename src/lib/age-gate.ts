const AGE_GATE_KEY = 'viking_tin_age_verified';

export function getAgeVerified(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(AGE_GATE_KEY) === 'true';
}

export function setAgeVerified(value: boolean) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AGE_GATE_KEY, value ? 'true' : 'false');
}

export function clearAgeVerified() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AGE_GATE_KEY);
}