import { useEffect } from 'react'

/** Modal centralizado no desktop e em folha inferior no mobile. */
export function Modal({ aberto, titulo, onFechar, children, rodape }) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (e) => e.key === 'Escape' && onFechar?.()
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberto, onFechar])

  if (!aberto) return null

  return (
    <div className="modal-fundo" onClick={onFechar} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={typeof titulo === 'string' ? titulo : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__cabecalho">
          <h2>{titulo}</h2>
          <button type="button" className="modal__fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </header>
        {children}
        {rodape && <div className="form-acoes">{rodape}</div>}
      </div>
    </div>
  )
}

/** Confirmação para ações destrutivas (cancelar, excluir, inativar). */
export function Confirmacao({ aberto, titulo, mensagem, textoConfirmar = 'Confirmar', onConfirmar, onFechar, carregando }) {
  return (
    <Modal
      aberto={aberto}
      titulo={titulo}
      onFechar={onFechar}
      rodape={
        <>
          <button type="button" className="btn btn--contorno" onClick={onFechar}>
            Voltar
          </button>
          <button
            type="button"
            className="btn btn--perigo"
            onClick={onConfirmar}
            disabled={carregando}
          >
            {textoConfirmar}
          </button>
        </>
      }
    >
      <p className="texto-suave">{mensagem}</p>
    </Modal>
  )
}
