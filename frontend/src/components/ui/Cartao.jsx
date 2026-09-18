export function Cartao({ titulo, acao, destaque = false, className = '', children }) {
  return (
    <section className={`card ${destaque ? 'card--destaque' : ''} ${className}`}>
      {(titulo || acao) && (
        <header className="card__titulo">
          {typeof titulo === 'string' ? <h3>{titulo}</h3> : titulo}
          {acao}
        </header>
      )}
      {children}
    </section>
  )
}

/** Indicador numérico usado nos painéis. */
export function Indicador({ rotulo, valor, apoio, tom = '' }) {
  return (
    <div className={`stat ${tom ? `stat--${tom}` : ''}`}>
      <span className="stat__rotulo">{rotulo}</span>
      <strong className="stat__valor">{valor}</strong>
      {apoio && <span className="stat__apoio">{apoio}</span>}
    </div>
  )
}

export function Etiqueta({ children, tom = '' }) {
  return <span className={`badge ${tom ? `badge--${tom}` : ''}`}>{children}</span>
}
