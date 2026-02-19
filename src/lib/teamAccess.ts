const TEAM_PIN_KEY = 'cck_team_pin_v1'
const TEAM_UNLOCKED_KEY = 'cck_team_unlocked_v1'

/**
 * Default PIN used until changed in the Team screen.
 * Note: This is a lightweight, device-local gate (not strong security).
 */
export const DEFAULT_TEAM_PIN = '1234'

export function getTeamPin(): string {
  const saved = localStorage.getItem(TEAM_PIN_KEY)
  return (saved && saved.trim()) ? saved : DEFAULT_TEAM_PIN
}

export function setTeamPin(pin: string) {
  localStorage.setItem(TEAM_PIN_KEY, pin)
}

export function isTeamUnlocked(): boolean {
  return localStorage.getItem(TEAM_UNLOCKED_KEY) === 'true'
}

export function unlockTeam(pinAttempt: string): boolean {
  const ok = pinAttempt.trim() === getTeamPin()
  if (ok) localStorage.setItem(TEAM_UNLOCKED_KEY, 'true')
  return ok
}

export function lockTeam() {
  localStorage.removeItem(TEAM_UNLOCKED_KEY)
}

export function clearTeamAccessData() {
  localStorage.removeItem(TEAM_UNLOCKED_KEY)
  localStorage.removeItem(TEAM_PIN_KEY)
}
