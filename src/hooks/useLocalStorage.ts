import { useState } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return initialValue
      const parsed = JSON.parse(raw)
      // Backfill any keys missing from an older saved shape (e.g. a
      // config saved before a new preference was added) rather than
      // silently leaving them undefined.
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? { ...initialValue, ...parsed }
        : (parsed as T)
    } catch {
      return initialValue
    }
  })

  const set = (next: T) => {
    setValue(next)
    try {
      window.localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // localStorage unavailable — config just won't persist this session
    }
  }

  return [value, set] as const
}
