import { moeda } from '../../utils/formato'

/**
 * Linha de barra proporcional usada nos relatórios.
 * `maximo` mantém todas as barras da mesma lista na mesma escala.
 */
export function Barra({ rotulo, valor, maximo, quantidade, tom = 'receita' }) {
  const percentual = maximo > 0 ? Math.max(2, (Number(valor) / Number(maximo)) * 100) : 0
  return (
    <div className="barra-linha">
      <span className="barra-rotulo" title={rotulo}>
        {rotulo}
        {quantidade != null && <span className="texto-fraco"> ({quantidade})</span>}
      </span>
      <span className="barra-trilho">
        <span
          className={`barra-preenchimento ${tom === 'gasto' ? 'barra-preenchimento--gasto' : ''}`}
          style={{ width: `${percentual}%` }}
        />
      </span>
      <span className="barra-valor">{moeda(valor)}</span>
    </div>
  )
}
