import { useMemo } from 'react'

function joinUrl(baseUrl: string, relativePath: string) {
  const base = (baseUrl ?? '/').endsWith('/') ? baseUrl : `${baseUrl}/`
  const rel = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${base}${rel}`
}

type PhotoBackdropProps = {
  enabled?: boolean
}

/**
 * Renders two visible photos (top-left + bottom-right) behind the app content.
 * We use inline styles based on BASE_URL so the images work reliably on GitHub Pages.
 */
export default function PhotoBackdrop({ enabled = true }: PhotoBackdropProps) {
  // We always render the element (when enabled) and let CSS decide where/how it shows.
  // This avoids over-restricting visibility and makes laptop + mobile consistent.
  const show = enabled

  const styles = useMemo(() => {
    if (!show) return null

    const base = import.meta.env.BASE_URL

    const instructorUrl = joinUrl(base, 'Instructors/DSC02882.jpg')
    const childUrl = joinUrl(base, 'Instructors/a2312705-26e0-4abf-81df-7e4a67182de0.jpg')

    const s: React.CSSProperties & Record<string, string> = {}
    s['--cck-instructor-url'] = `url("${instructorUrl}")`
    s['--cck-child-url'] = `url("${childUrl}")`
    return s
  }, [show])

  if (!styles) return null

  return <div className="photoBackdrop" style={styles} aria-hidden="true" />
}
