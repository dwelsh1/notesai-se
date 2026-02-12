import { createContext, useCallback, useContext, useState } from 'react'

type SemanticSearchContextValue = {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

const SemanticSearchContext = createContext<SemanticSearchContextValue | null>(null)

export function SemanticSearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const openModal = useCallback(() => setIsOpen(true), [])
  const closeModal = useCallback(() => setIsOpen(false), [])
  const value = { isOpen, openModal, closeModal }
  return (
    <SemanticSearchContext.Provider value={value}>
      {children}
    </SemanticSearchContext.Provider>
  )
}

export function useSemanticSearchModal() {
  const ctx = useContext(SemanticSearchContext)
  if (!ctx) {
    return {
      isOpen: false,
      openModal: () => {},
      closeModal: () => {},
    }
  }
  return ctx
}
