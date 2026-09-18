import { Link } from 'react-router-dom'
import { agendamentoService } from '../../services/agendamentoService'
import { financeiroService } from '../../services/financeiroService'
import { produtoService } from '../../services/produtoService'
import { useCarregar } from '../../hooks/useCarregar'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { hojeISO, dataPorExtenso, hora, moeda, rotuloStatus } from '../../utils/formato'

/** Painel administrativo: indicadores do dia/mês, agenda e alertas de estoque. */
export default function PainelAdmin() {
  const resumo = useCarregar(() => financeiroService.dashboard(), [])
  const agenda = useCarregar(() => agendamentoService.agendaDoDia({ data: hojeISO() }), [])
  const estoque = useCarregar(() => produtoService.estoqueBaixo(), [])

  if (resumo.carregando) return <Carregando />
  if (resumo.erro) return <Erro mensagem={resumo.erro} onTentarNovamente={resumo.recarregar} />

  const d = resumo.dados
  const saldoPositivo = Number(d?.saldoMes ?? 0) >= 0

  return (
    <>
      <CabecalhoPagina
        titulo="Painel da barbearia"
        subtitulo={dataPorExtenso(hojeISO())}
        acao={
          <Link className="btn btn--primario" to="/admin/financeiro">
            Ver relatório completo
          </Link>
        }
      />

      <div className="pilha">
        <div className="grade grade--4">
          <Indicador
            rotulo="Agendamentos hoje"
            valor={d.agendamentosHoje}
            apoio={`${d.agendamentosConcluidosHoje} concluído(s)`}
          />
          <Indicador rotulo="Faturamento hoje" valor={moeda(d.faturamentoHoje)} tom="marca" />
          <Indicador
            rotulo="Faturamento do mês"
            valor={moeda(d.faturamentoMes)}
            apoio={`${d.agendamentosMes} atendimento(s)`}
          />
          <Indicador
            rotulo="Saldo do mês"
            valor={moeda(d.saldoMes)}
            apoio={`Despesas: ${moeda(d.despesasMes)}`}
            tom={saldoPositivo ? 'sucesso' : 'erro'}
          />
        </div>

        <div className="grade grade--3">
          <Indicador rotulo="Barbeiros ativos" valor={d.barbeirosAtivos} />
          <Indicador rotulo="Clientes com assinatura" valor={d.clientesComAssinatura} />
          <Indicador
            rotulo="Produtos em estoque baixo"
            valor={d.produtosEmEstoqueBaixo}
            tom={d.produtosEmEstoqueBaixo > 0 ? 'erro' : 'sucesso'}
            apoio={d.produtosEmEstoqueBaixo > 0 ? 'Precisam de reposição' : 'Estoque saudável'}
          />
        </div>

        <div className="grade grade--2-1">
          <Cartao
            titulo="Agenda de hoje"
            acao={
              <Link className="btn btn--texto btn--pequeno" to="/admin/agenda">
                Ver agenda
              </Link>
            }
          >
            {agenda.carregando ? (
              <Carregando />
            ) : agenda.dados?.length ? (
              <div className="lista">
                {agenda.dados.slice(0, 8).map((item) => {
                  const status = rotuloStatus(item.status)
                  return (
                    <div className="item" key={item.id}>
                      <div className="item__principal">
                        <span className="item__titulo">
                          {hora(item.horario)} · {item.clienteNome}
                        </span>
                        <span className="item__meta">
                          <span>{item.servicoNome}</span>
                          <span>{item.barbeiroNome}</span>
                          <span>{moeda(item.valor)}</span>
                        </span>
                      </div>
                      <Etiqueta tom={status.classe.replace('badge--', '')}>{status.texto}</Etiqueta>
                    </div>
                  )
                })}
              </div>
            ) : (
              <Vazio icone="📅" titulo="Nenhum agendamento para hoje" />
            )}
          </Cartao>

          <Cartao
            titulo="Alerta de estoque"
            acao={
              <Link className="btn btn--texto btn--pequeno" to="/admin/estoque">
                Repor
              </Link>
            }
          >
            {estoque.carregando ? (
              <Carregando />
            ) : estoque.dados?.length ? (
              <div className="lista">
                {estoque.dados.map((produto) => (
                  <div className="item" key={produto.id}>
                    <div className="item__principal">
                      <span className="item__titulo">{produto.nome}</span>
                      <span className="item__meta">
                        <span>
                          {produto.quantidade} em estoque · mínimo {produto.quantidadeMinima}
                        </span>
                      </span>
                    </div>
                    <Etiqueta tom="erro">Repor</Etiqueta>
                  </div>
                ))}
              </div>
            ) : (
              <Vazio icone="✅" titulo="Estoque em dia" descricao="Nenhum produto abaixo do mínimo." />
            )}
          </Cartao>
        </div>
      </div>
    </>
  )
}
