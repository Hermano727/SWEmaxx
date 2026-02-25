/**
 * Human-readable formatting for mistake log entries (time, severity, phase/category).
 */

/** Format mistake time: ISO timestamp → "Feb 25, 2026, 5:12 AM" or "12m in"; else return as-is. */
export function formatMistakeTime(time: string): string {
  if (!time || typeof time !== "string") return ""
  const trimmed = time.trim()
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)
  if (iso) {
    try {
      const d = new Date(trimmed)
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      }
    } catch {
      // fall through to return as-is
    }
  }
  return trimmed
}

/** Capitalize severity for display: "critical" → "Critical". */
export function formatSeverity(severity: string): string {
  if (!severity) return ""
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()
}

/** Title-case a phrase: "jumped to coding too early" → "Jumped to coding too early". */
export function formatPhaseOrCategory(s: string): string {
  if (!s) return ""
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
