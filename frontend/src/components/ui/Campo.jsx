/** Campo de formulário com rótulo, dica e mensagem de erro. */
export function Campo({ rotulo, erro, dica, children, htmlFor }) {
  return (
    <div className="campo">
      {rotulo && (
        <label className="campo__rotulo" htmlFor={htmlFor}>
          {rotulo}
        </label>
      )}
      {children}
      {dica && !erro && <span className="campo__dica">{dica}</span>}
      {erro && <span className="campo__erro">{erro}</span>}
    </div>
  )
}

/** Input já ligado ao estilo do design system. */
export function Entrada({ erro, className = '', ...resto }) {
  return (
    <input
      className={`campo__controle ${erro ? 'campo__controle--erro' : ''} ${className}`}
      {...resto}
    />
  )
}

export function Selecao({ erro, className = '', children, ...resto }) {
  return (
    <select
      className={`campo__controle ${erro ? 'campo__controle--erro' : ''} ${className}`}
      {...resto}
    >
      {children}
    </select>
  )
}

export function AreaTexto({ erro, className = '', ...resto }) {
  return (
    <textarea
      className={`campo__controle ${erro ? 'campo__controle--erro' : ''} ${className}`}
      {...resto}
    />
  )
}
