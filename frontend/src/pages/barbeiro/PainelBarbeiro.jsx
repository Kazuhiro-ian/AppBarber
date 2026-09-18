import { Link } from 'react-router-dom'
import { barbeiroService } from '../../services/barbeiroService'
import { useCarregar } from '../../hooks/useCarregar'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { dataPorExtenso, hora, moeda, rotuloStatus } from '../../utils/formato'

/** Visão geral do dia do barbeiro: indicadores, próximo cliente e agenda. */
export default function PainelBarbeiro() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => barbeiroService.painel(), [])

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  const proximo = dados?.proximoAtendimento
  const agenda = dados?.agendaDoDia ?? []

  return (
    <>
      <CabecalhoPagina
        titulo={`Bom trabalho, ${primeiroNome(dados?.barbeiroNome)}!`}
        subtitulo={dataPorExtenso(dados?.data)}
        acao={
          <Link className="btn btn--primario" to="/barbeiro/agenda">
            Abrir agenda do dia
          </Link>
        }
      />

      <div className="pilha">
        <div className="grade grade--4">
          <Indicador rotulo="Atendimentos hoje" valor={dados?.atendimentosHoje ?? 0} />
          <Indicador
            rotulo="Concluídos"
            valor={dados?.concluidosHoje ?? 0}
            apoio={`${dados?.pendentesHoje ?? 0} pendentes`}
            tom="sucesso"
          />
          <Indicador
            rotulo="Faturamento do dia"
            valor={moeda(dados?.faturamentoHoje)}
            apoio={`Comissão: ${moeda(dados?.comissaoHoje)}`}
            tom="marca"
          />
          <Indicador
            rotulo="Faturamento do mês"
            valor={moeda(dados?.faturamentoMes)}
            apoio={`Comissão: ${moeda(dados?.comissaoMes)}`}
          />
        </div>

        {proximo ? (
          <Cartao destaque titulo="Próximo cliente">
            <div className="linha-entre">
              <div className="pilha" style={{ gap: 6 }}>
                <strong style={{ fontSize: '1.15rem' }}>{proximo.clienteNome}</strong>
                <span className="texto-suave">
                  {proximo.servicoNome} · {hora(proximo.horario)} – {hora(proximo.horarioFim)}
                </span>
                {proximo.clienteTelefone && (
                  <span className="texto-fraco">📞 {proximo.clienteTelefone}</span>
                )}
              </div>
              <Etiqueta tom="marca">{moeda(proximo.valor)}</Etiqueta>
            </div>
          </Cartao>
        ) : (
          <Cartao>
            <Vazio icone="☕" titulo="Nenhum atendimento pendente agora" descricao="Aproveite a pausa." />
          </Cartao>
        )}

        <Cartao
          titulo="Agenda de hoje"
          acao={
            <Link className="btn btn--texto btn--pequeno" to="/barbeiro/agenda">
              Gerenciar
            </Link>
          }
        >
          {agenda.length ? (
            <div className="lista">
              {agenda.map((item) => {
                const status = rotuloStatus(item.status)
                return (
                  <div className="item" key={item.id}>
                    <div className="item__principal">
                      <span className="item__titulo">
                        {hora(item.horario)} · {item.clienteNome}
                      </span>
                      <span className="item__meta">
                        <span>{item.servicoNome}</span>
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
      </div>
    </>
  )
}

function primeiroNome(nome) {
  return nome ? nome.trim().split(/\s+/)[0] : 'barbeiro'
}
