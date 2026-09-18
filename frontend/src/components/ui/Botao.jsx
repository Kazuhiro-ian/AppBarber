/** Botão padrão. `variante` define a cor; `carregando` bloqueia cliques duplos. */
export function Botao({
  children,
  variante = 'padrao',
  tipo = 'button',
  bloco = false,
  pequeno = false,
  carregando = false,
  disabled = false,
  className = '',
  ...resto
}) {
  const classes = [
    'btn',
    variante !== 'padrao' && `btn--${variante}`,
    bloco && 'btn--bloco',
    pequeno && 'btn--pequeno',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={tipo} className={classes} disabled={disabled || carregando} {...resto}>
      {carregando && <span className="spinner" style={{ width: 15, height: 15, borderWidth: 2 }} />}
      {children}
    </button>
  )
}
