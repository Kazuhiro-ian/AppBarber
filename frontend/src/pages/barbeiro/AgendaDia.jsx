import { useState } from 'react'
import { agendamentoService } from '../../services/agendamentoService'
import { barbeiroService } from '../../services/barbeiroService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Confirmacao } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { dataPorExtenso, hojeISO, hora, moeda, rotuloStatus, somarDias } from '../../utils/formato'

/** Agenda do dia do barbeiro, com concluir e cancelar atendimento. */
export default function AgendaDia() {
  const toast = useToast()
  const [dia, setDia] = useState(hojeISO())
  const [processando, setProcessando] = useState(false)
  const [paraCancelar, setParaCancelar] = useState(null)

  const { dados, carregando, erro, recarregar } = useCarregar(
    () => barbeiroService.agenda({ data: dia }),
    [dia],
  )

  async function concluir(agendamento) {
    setProcessando(true)
    try {
      await agendamentoService.concluir(agendamento.id)
      toast.sucesso('Atendimento concluído.')
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível concluir o atendimento.')
    } finally {
      setProcessando(false)
    }
  }

  async function cancelar() {
    setProcessando(true)
    try {
      await agendamentoService.cancelar(paraCancelar.id)
      toast.sucesso('Atendimento cancelado.')
      setParaCancelar(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível cancelar.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Agenda do dia" subtitulo={dataPorExtenso(dia)} />

      <div className="filtros">
        <Campo rotulo="Data" htmlFor="dia">
          <Entrada id="dia" type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
        </Campo>
        <div className="linha" style={{ gap: 8 }}>
          <Botao pequeno variante="contorno" onClick={() => setDia(somarDias(dia, -1))}>
            ◀ Anterior
          </Botao>
          <Botao pequeno variante="contorno" onClick={() => setDia(hojeISO())}>
            Hoje
          </Botao>
          <Botao pequeno variante="contorno" onClick={() => setDia(somarDias(dia, 1))}>
            Próximo ▶
          </Botao>
        </div>
      </div>

      {carregando ? (
        <Carregando />
      ) : erro ? (
        <Erro mensagem={erro} onTentarNovamente={recarregar} />
      ) : (
        <div className="pilha">
          <div className="grade grade--4">
            <Indicador rotulo="Confirmados" valor={dados?.totalConfirmados ?? 0} />
            <Indicador rotulo="Concluídos" valor={dados?.totalConcluidos ?? 0} tom="sucesso" />
            <Indicador
              rotulo="Previsto"
              valor={moeda(dados?.faturamentoPrevisto)}
              apoio={`Comissão prevista: ${moeda(dados?.comissaoPrevista)}`}
              tom="marca"
            />
            <Indicador
              rotulo="Realizado"
              valor={moeda(dados?.faturamentoRealizado)}
              apoio={`${dados?.totalCancelados ?? 0} cancelado(s)`}
            />
          </div>

          <Cartao
            titulo="Atendimentos"
            acao={
              <span className="texto-fraco">
                Jornada: {hora(dados?.horarioInicio)} às {hora(dados?.horarioFim)}
              </span>
            }
          >
            {dados?.agendamentos?.length ? (
              <div className="lista">
                {dados.agendamentos.map((item) => {
                  const status = rotuloStatus(item.status)
                  return (
                    <article className="item" key={item.id}>
                      <div className="item__principal">
                        <span className="item__titulo">
                          {hora(item.horario)} – {hora(item.horarioFim)} · {item.clienteNome}
                        </span>
                        <span className="item__meta">
                          <span>💈 {item.servicoNome}</span>
                          <span>💰 {moeda(item.valor)}</span>
                          {item.clienteTelefone && <span>📞 {item.clienteTelefone}</span>}
                        </span>
                      </div>
                      <div className="item__acoes">
                        <Etiqueta tom={status.classe.replace('badge--', '')}>{status.texto}</Etiqueta>
                        {item.status === 'CONFIRMADO' && (
                          <>
                            <Botao
                              pequeno
                              variante="sucesso"
                              disabled={processando}
                              onClick={() => concluir(item)}
                            >
                              Concluir
                            </Botao>
                            <Botao pequeno variante="perigo" onClick={() => setParaCancelar(item)}>
                              Cancelar
                            </Botao>
                          </>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <Vazio icone="📅" titulo="Nenhum atendimento nesta data" />
            )}
          </Cartao>
        </div>
      )}

      <Confirmacao
        aberto={Boolean(paraCancelar)}
        titulo="Cancelar atendimento"
        mensagem={
          paraCancelar
            ? `Cancelar o atendimento de ${paraCancelar.clienteNome} às ${hora(paraCancelar.horario)}?`
            : ''
        }
        textoConfirmar="Cancelar atendimento"
        carregando={processando}
        onConfirmar={cancelar}
        onFechar={() => setParaCancelar(null)}
      />
    </>
  )
}
