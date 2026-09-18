import { useState } from 'react'
import { financeiroService } from '../../services/financeiroService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Barra } from '../../components/ui/Barra'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import {
  data,
  dataCurta,
  fimDoMes,
  hojeISO,
  inicioDoMes,
  moeda,
  somarDias,
} from '../../utils/formato'

/** Gestão financeira: ganhos, gastos, saldo, relatório detalhado e comparativos. */
export default function GestaoFinanceira() {
  const toast = useToast()
  const [inicio, setInicio] = useState(inicioDoMes())
  const [fim, setFim] = useState(fimDoMes())
  const [comparativo, setComparativo] = useState(null)
  const [comparando, setComparando] = useState(false)

  const relatorio = useCarregar(() => financeiroService.relatorio(inicio, fim), [inicio, fim])

  function aplicarAtalho(dias) {
    setInicio(somarDias(hojeISO(), -dias))
    setFim(hojeISO())
    setComparativo(null)
  }

  /** Compara o período selecionado com o período imediatamente anterior, de mesma duração. */
  async function compararComAnterior() {
    setComparando(true)
    try {
      const duracaoDias = Math.max(
        0,
        Math.round((new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24)),
      )
      const resultado = await financeiroService.comparativo({
        inicioA: somarDias(inicio, -(duracaoDias + 1)),
        fimA: somarDias(inicio, -1),
        inicioB: inicio,
        fimB: fim,
      })
      setComparativo(resultado)
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível comparar os períodos.')
    } finally {
      setComparando(false)
    }
  }

  if (relatorio.carregando) return <Carregando />
  if (relatorio.erro) return <Erro mensagem={relatorio.erro} onTentarNovamente={relatorio.recarregar} />

  const r = relatorio.dados
  const positivo = Number(r.saldoLiquido) >= 0
  const maiorReceitaServico = maximo(r.receitaPorServico)
  const maiorReceitaBarbeiro = maximo(r.receitaPorBarbeiro)
  const maiorGasto = maximo(r.gastosPorCategoria)
  const maiorDia = Math.max(0, ...(r.evolucaoDiaria ?? []).map((p) => Number(p.valor)))

  return (
    <>
      <CabecalhoPagina
        titulo="Gestão financeira"
        subtitulo={`Período de ${data(r.periodoInicio)} a ${data(r.periodoFim)}`}
        acao={
          <Botao variante="contorno" onClick={compararComAnterior} carregando={comparando}>
            Comparar com período anterior
          </Botao>
        }
      />

      <div className="filtros">
        <Campo rotulo="De" htmlFor="de">
          <Entrada id="de" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        <Campo rotulo="Até" htmlFor="ate">
          <Entrada id="ate" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </Campo>
        <div className="linha" style={{ gap: 8, flexWrap: 'wrap' }}>
          <Botao pequeno variante="contorno" onClick={() => aplicarAtalho(6)}>
            7 dias
          </Botao>
          <Botao pequeno variante="contorno" onClick={() => aplicarAtalho(29)}>
            30 dias
          </Botao>
          <Botao
            pequeno
            variante="contorno"
            onClick={() => {
              setInicio(inicioDoMes())
              setFim(fimDoMes())
              setComparativo(null)
            }}
          >
            Mês atual
          </Botao>
        </div>
      </div>

      <div className="pilha">
        <div className="grade grade--4">
          <Indicador rotulo="Ganhos" valor={moeda(r.ganhos)} apoio="Atendimentos concluídos" tom="sucesso" />
          <Indicador rotulo="Gastos" valor={moeda(r.gastos)} apoio="Despesas lançadas" tom="erro" />
          <Indicador
            rotulo="Saldo líquido"
            valor={moeda(r.saldoLiquido)}
            apoio={positivo ? 'Resultado positivo' : 'Resultado negativo'}
            tom={positivo ? 'sucesso' : 'erro'}
          />
          <Indicador
            rotulo="Ticket médio"
            valor={moeda(r.ticketMedio)}
            apoio={`${r.atendimentosConcluidos} atendimento(s)`}
            tom="marca"
          />
        </div>

        <div className="grade grade--3">
          <Indicador rotulo="Receita de serviços" valor={moeda(r.receitaServicos)} />
          <Indicador
            rotulo="Receita de assinaturas"
            valor={moeda(r.receitaAssinaturas)}
            apoio="Planos contratados no período (informativo)"
          />
          <Indicador
            rotulo="Comissões a pagar"
            valor={moeda(r.totalComissoes)}
            apoio="Sobre atendimentos concluídos"
          />
        </div>

        {comparativo && (
          <Cartao
            titulo="Comparativo com o período anterior"
            acao={
              <Botao pequeno variante="texto" onClick={() => setComparativo(null)}>
                Ocultar
              </Botao>
            }
          >
            <div className="tabela-wrapper">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Indicador</th>
                    <th className="numerico">
                      Anterior ({data(comparativo.periodoA.periodoInicio)} –{' '}
                      {data(comparativo.periodoA.periodoFim)})
                    </th>
                    <th className="numerico">Atual</th>
                    <th className="numerico">Variação</th>
                  </tr>
                </thead>
                <tbody>
                  <LinhaComparativo
                    rotulo="Ganhos"
                    anterior={comparativo.periodoA.ganhos}
                    atual={comparativo.periodoB.ganhos}
                    variacao={comparativo.variacaoGanhos}
                  />
                  <LinhaComparativo
                    rotulo="Gastos"
                    anterior={comparativo.periodoA.gastos}
                    atual={comparativo.periodoB.gastos}
                    variacao={comparativo.variacaoGastos}
                    inverterCor
                  />
                  <LinhaComparativo
                    rotulo="Saldo líquido"
                    anterior={comparativo.periodoA.saldoLiquido}
                    atual={comparativo.periodoB.saldoLiquido}
                    variacao={comparativo.variacaoSaldo}
                  />
                </tbody>
              </table>
            </div>
          </Cartao>
        )}

        <div className="grade grade--2">
          <Cartao titulo="Receita por serviço">
            {r.receitaPorServico?.length ? (
              r.receitaPorServico.map((linha) => (
                <Barra
                  key={linha.rotulo}
                  rotulo={linha.rotulo}
                  valor={linha.total}
                  quantidade={linha.quantidade}
                  maximo={maiorReceitaServico}
                />
              ))
            ) : (
              <Vazio icone="📊" titulo="Sem atendimentos concluídos no período" />
            )}
          </Cartao>

          <Cartao titulo="Receita por barbeiro">
            {r.receitaPorBarbeiro?.length ? (
              r.receitaPorBarbeiro.map((linha) => (
                <Barra
                  key={linha.rotulo}
                  rotulo={linha.rotulo}
                  valor={linha.total}
                  quantidade={linha.quantidade}
                  maximo={maiorReceitaBarbeiro}
                />
              ))
            ) : (
              <Vazio icone="✂️" titulo="Sem dados no período" />
            )}
          </Cartao>
        </div>

        <div className="grade grade--2">
          <Cartao titulo="Gastos por categoria">
            {r.gastosPorCategoria?.length ? (
              r.gastosPorCategoria.map((linha) => (
                <Barra
                  key={linha.rotulo}
                  rotulo={linha.rotulo}
                  valor={linha.total}
                  quantidade={linha.quantidade}
                  maximo={maiorGasto}
                  tom="gasto"
                />
              ))
            ) : (
              <Vazio icone="🧾" titulo="Nenhuma despesa no período" />
            )}
          </Cartao>

          <Cartao titulo="Comissões por barbeiro">
            {r.comissoes?.length ? (
              <div className="tabela-wrapper">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Barbeiro</th>
                      <th className="numerico">Atend.</th>
                      <th className="numerico">Faturou</th>
                      <th className="numerico">%</th>
                      <th className="numerico">Comissão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.comissoes.map((c) => (
                      <tr key={c.barbeiroId}>
                        <td>{c.barbeiroNome}</td>
                        <td className="numerico">{c.atendimentosConcluidos}</td>
                        <td className="numerico">{moeda(c.faturamento)}</td>
                        <td className="numerico">{Number(c.percentualComissao ?? 0).toFixed(1)}%</td>
                        <td className="numerico">
                          <strong>{moeda(c.valorComissao)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Vazio icone="💰" titulo="Sem comissões no período" />
            )}
          </Cartao>
        </div>

        <Cartao
          titulo="Evolução diária da receita"
          acao={<Etiqueta tom="marca">{moeda(r.receitaServicos)} no período</Etiqueta>}
        >
          {r.evolucaoDiaria?.length ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, minHeight: 140, overflowX: 'auto' }}>
              {r.evolucaoDiaria.map((ponto) => (
                <div
                  key={ponto.data}
                  title={`${data(ponto.data)}: ${moeda(ponto.valor)} (${ponto.quantidade} atendimento(s))`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 34 }}
                >
                  <span
                    style={{
                      width: 22,
                      height: `${maiorDia > 0 ? Math.max(6, (Number(ponto.valor) / maiorDia) * 110) : 6}px`,
                      borderRadius: 6,
                      background: 'linear-gradient(180deg, var(--cor-marca), var(--cor-marca-escura))',
                    }}
                  />
                  <span className="texto-fraco" style={{ fontSize: '0.68rem' }}>
                    {dataCurta(ponto.data)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Vazio icone="📈" titulo="Nenhuma receita registrada no período" />
          )}
        </Cartao>
      </div>
    </>
  )
}

function LinhaComparativo({ rotulo, anterior, atual, variacao, inverterCor = false }) {
  const valor = Number(variacao ?? 0)
  const bom = inverterCor ? valor <= 0 : valor >= 0
  return (
    <tr>
      <td>{rotulo}</td>
      <td className="numerico texto-suave">{moeda(anterior)}</td>
      <td className="numerico">{moeda(atual)}</td>
      <td className={`numerico ${bom ? 'valor-positivo' : 'valor-negativo'}`}>
        {valor >= 0 ? '+' : ''}
        {moeda(valor)}
      </td>
    </tr>
  )
}

function maximo(linhas) {
  return Math.max(0, ...(linhas ?? []).map((l) => Number(l.total)))
}
