import { useContext } from 'react'
import { I18nContext, type I18nValue } from './I18nContext'

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useI18n muss innerhalb von <I18nProvider> verwendet werden.')
  return value
}
