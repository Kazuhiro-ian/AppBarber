import { useMemo, useState } from 'react'
import { agendamentoService } from '../../services/agendamentoService'
import { barbeiroService } from '../../services/barbeiroService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada, Selecao } from '../../components/ui/Campo'
import { Confirmacao } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { dataPorExtenso, hojeISO, hora, moeda, rotuloStatus, somarDias } from '../../utils/formato'

/** Agenda de toda a barbearia em um dia, com filtro por barbeiro e status. */
export default function AgendaGeral() {
  const toast = useToast()
  const [dia, setDia] = useState(hojeISO())
  const [filtroBarbeiro, setFiltroBarbeiro] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [paraCancelar, setParaCancelar] = useState(null)
  const [processando, setProcessando] = useState(false)

  const agenda = useCarregar(() => agendamentoService.agendaDoDia({ data: dia }), [dia])
  const barbeiros = useCarregar(() => barbeiroService.listarTodos(), [])

  const filtrada = useMemo(() => {
    let lista = agenda.dados ?? []
    if (filtroBarbeiro) lista = lista.filter((a) => String(a.barbeiroId) === filtroBarbeiro)
    if (filtroStatus) lista = lista.filter((a) => a.status === filtroStatus)
    return lista
  }, [agenda.dados, filtroBarbeiro, filtroStatus])

  const totais = useMemo(() => {
    const lista = agenda.dados ?? []
    const soma = (status) =>
      lista.filter((a) => a.status === status).reduce((acc, a) => acc + Number(a.valor ?? 0), 0)
    return {
      confirmados: lista.filter((a) => a.status === 'CONFIRMADO').length,
      concluidos: lista.filter((a) => a.status === 'CONCLUIDO').length,
      cancelados: lista.filter((a) => a.status === 'CANCELADO').length,
      realizado: soma('CONCLUIDO'),
      previsto: soma('CONCLUIDO') + soma('CONFIRMADO'),
    }
  }, [agenda.dados])

  async function concluir(item) {
    setProcessando(true)
    try {
      await agendamentoService.concluir(item.id)
      toast.sucesso('Atendimento concluído.')
      agenda.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível concluir.')
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
      agenda.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível cancelar.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Agenda geral" subtitulo={dataPorExtenso(dia)} />

      <div className="filtros">
        <Campo rotulo="Data" htmlFor="dia">
          <Entrada id="dia" type="date" value={dia} onChange={(e) => setDia(e.target.value)} />
        </Campo>
        <Campo rotulo="Barbeiro" htmlFor="barbeiro">
          <Selecao
            id="barbeiro"
            value={filtroBarbeiro}
            onChange={(e) => setFiltroBarbeiro(e.target.value)}
          >
            <option value="">Todos</option>
            {(barbeiros.dados ?? []).map((b) => (
              <option key={b.id} value={b.id}>
                {b.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo rotulo="Situação" htmlFor="status">
          <Selecao id="status" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
            <option value="">Todas</option>
            <option value="CONFIRMADO">Confirmados</option>
            <option value="CONCLUIDO">Concluídos</option>
            <option value="CANCELADO">Cancelados</option>
          </Selecao>
        </Campo>
        <div className="linha" style={{ gap: 8 }}>
          <Botao pequeno variante="contorno" onClick={() => setDia(somarDias(dia, -1))}>
            ◀
          </Botao>
          <Botao pequeno variante="contorno" onClick={() => setDia(hojeISO())}>
            Hoje
          </Botao>
          <Botao pequeno variante="contorno" onClick={() => setDia(somarDias(dia, 1))}>
            ▶
          </Botao>
        </div>
      </div>

      {agenda.carregando ? (
        <Carregando />
      ) : agenda.erro ? (
        <Erro mensagem={agenda.erro} onTentarNovamente={agenda.recarregar} />
      ) : (
        <div className="pilha">
          <div className="grade grade--4">
            <Indicador rotulo="Confirmados" valor={totais.confirmados} />
            <Indicador rotulo="Concluídos" valor={totais.concluidos} tom="sucesso" />
            <Indicador rotulo="Cancelados" valor={totais.cancelados} tom="erro" />
            <Indicador
              rotulo="Faturamento do dia"
              valor={moeda(totais.realizado)}
              apoio={`Previsto: ${moeda(totais.previsto)}`}
              tom="marca"
            />
          </div>

          <Cartao titulo={`Atendimentos (${filtrada.length})`}>
            {filtrada.length ? (
              <div className="lista">
                {filtrada.map((item) => {
                  const status = rotuloStatus(item.status)
                  return (
                    <article className="item" key={item.id}>
                      <div className="item__principal">
                        <span className="item__titulo">
                          {hora(item.horario)} – {hora(item.horarioFim)} · {item.clienteNome}
                        </span>
                        <span className="item__meta">
                          <span>✂️ {item.barbeiroNome}</span>
                          <span>💈 {item.servicoNome}</span>
                          <span>💰 {moeda(item.valor)}</span>
                          {item.clienteTelefone && <span>📞 {item.clienteTelefone}</span>}
                        </span>
                      </div>
                      <div className="item__acoes">
                        <Etiqueta tom={status.classe.replace('badge--', '')}>{status.texto}</Etiqueta>
                        {item.status === 'CONFIRMADO' && (
                          <>
                            <Botao pequeno variante="sucesso" disabled={processando} onClick={() => concluir(item)}>
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
              <Vazio icone="📅" titulo="Nenhum atendimento com esses filtros" />
            )}
          </Cartao>
        </div>
      )}

      <Confirmacao
        aberto={Boolean(paraCancelar)}
        titulo="Cancelar atendimento"
        mensagem={
          paraCancelar
            ? `Cancelar ${paraCancelar.servicoNome} de ${paraCancelar.clienteNome} às ${hora(paraCancelar.horario)}?`
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
