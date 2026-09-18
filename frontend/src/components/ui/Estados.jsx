/** Estados de carregamento, erro e lista vazia — repetidos em quase toda tela. */

export function Carregando({ texto = 'Carregando...' }) {
  return (
    <div className="carregando">
      <span className="spinner" />
      {texto}
    </div>
  )
}

export function Erro({ mensagem, onTentarNovamente }) {
  return (
    <div className="aviso aviso--erro">
      <span>⚠</span>
      <div>
        <div>{mensagem}</div>
        {onTentarNovamente && (
          <button type="button" className="btn btn--texto btn--pequeno" onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  )
}

export function Vazio({ icone = '📭', titulo, descricao, acao }) {
  return (
    <div className="vazio">
      <span className="vazio__icone">{icone}</span>
      <strong>{titulo}</strong>
      {descricao && <span className="texto-fraco">{descricao}</span>}
      {acao}
    </div>
  )
}
