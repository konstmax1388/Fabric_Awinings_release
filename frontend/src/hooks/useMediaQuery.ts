import { useCallback, useSyncExternalStore } from 'react'

/**
 * Подписка на matchMedia (например для раскладки Hero на мобильных).
 * useSyncExternalStore даёт актуальное значение на клиенте без «ложного» первого кадра с matches=false.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {}
      }
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback((): boolean => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
