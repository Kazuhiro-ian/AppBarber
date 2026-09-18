import { createContext, useCallback, useMemo, useState } from 'react'

/** Notificações curtas de sucesso/erro exibidas no canto da tela. */
export const ToastContext = createContext(null)

const DURACAO_MS = 4000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const remover = useCallback((id) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id))
  }, [])

  const notificar = useCallback(
    (mensagem, tipo = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((atuais) => [...atuais, { id, mensagem, tipo }])
      setTimeout(() => remover(id), DURACAO_MS)
    },
    [remover],
  )

  const valor = useMemo(
    () => ({
      notificar,
      sucesso: (mensagem) => notificar(mensagem, 'sucesso'),
      erro: (mensagem) => notificar(mensagem, 'erro'),
    }),
    [notificar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`} onClick={() => remover(t.id)}>
            {t.mensagem}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
