import { useResumeStore } from '../stores/resumeStore'
import { messages } from '../utils/i18n'

export function useI18n() {
  const store = useResumeStore()

  function t(key: string, params?: Record<string, string | number>): string {
    const [ns, k] = key.split('.')
    if (!ns || !k) return key
    let text = messages[store.language]?.[ns]?.[k] ?? key
    if (params) {
      for (const [pKey, pVal] of Object.entries(params)) {
        text = text.replace(`{${pKey}}`, String(pVal))
      }
    }
    return text
  }

  return { t }
}
