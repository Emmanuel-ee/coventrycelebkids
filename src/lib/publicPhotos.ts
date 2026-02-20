const INSTRUCTORS_DIR = 'Instructors'

export function publicAssetUrl(relativePath: string) {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const normalizedPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${normalizedBase}${normalizedPath}`
}

export function getPublicInstructorPhotoUrl(filename: string) {
  return publicAssetUrl(`${INSTRUCTORS_DIR}/${encodeURIComponent(filename)}`)
}

export function initials(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
  const letters = parts.map((p) => p[0]?.toUpperCase()).filter(Boolean)
  return letters.join('') || 'CK'
}
