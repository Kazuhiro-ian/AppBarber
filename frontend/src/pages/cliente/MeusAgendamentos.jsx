import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { agendamentoService } from '../../services/agendamentoService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Confirmacao, Modal } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { data, hojeISO, hora, moeda, rotuloStatus, somarDias } from '../../utils/formato'

const ABAS = [
  { chave: 'PROXIMOS', rotulo: 'Próximos' },
  { chave: 'CONCLUIDO', rotulo: 'Concluídos' },
  { chave: 'CANCELADO', rotulo: 'Cancelados' },
]

/** Histórico do cliente com as ações de cancelar e remarcar. */
export default function MeusAgendamentos() {
  const toast = useToast()
  const { dados, carregando, erro, recarregar } = useCarregar(() => agendamentoService.meus(), [])

  const [aba, setAba] = useState('PROXIMOS')
  const [paraCancelar, setParaCancelar] = useState(null)
  const [paraRemarcar, setParaRemarcar] = useState(null)
  const [novaData, setNovaData] = useState(hojeISO())
  const [novoHorario, setNovoHorario] = useState('')
  const [horariosLivres, setHorariosLivres] = useState([])
  const [buscandoHorarios, setBuscandoHorarios] = useState(false)
  const [processando, setProcessando] = useState(false)

  const listas = useMemo(() => {
    const todos = dados ?? []
    return {
      PROXIMOS: todos.filter((a) => a.status === 'CONFIRMADO'),
      CONCLUIDO: todos.filter((a) => a.status === 'CONCLUIDO'),
      CANCELADO: todos.filter((a) => a.status === 'CANCELADO'),
    }
  }, [dados])

  async function abrirRemarcacao(agendamento) {
    setParaRemarcar(agendamento)
    setNovoHorario('')
    const proximaData = somarDias(hojeISO(), 1)
    setNovaData(proximaData)
    await carregarHorarios(agendamento, proximaData)
  }

  async function carregarHorarios(agendamento, dia) {
    setBuscandoHorarios(true)
    try {
      const grade = await agendamentoService.disponibilidade({
        barbeiroId: agendamento.barbeiroId,
        servicoId: agendamento.servicoId,
        data: dia,
      })
      setHorariosLivres(grade.horariosDisponiveis ?? [])
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível carregar os horários.')
      setHorariosLivres([])
    } finally {
      setBuscandoHorarios(false)
    }
  }

  async function confirmarCancelamento() {
    setProcessando(true)
    try {
      await agendamentoService.cancelar(paraCancelar.id)
      toast.sucesso('Agendamento cancelado.')
      setParaCancelar(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível cancelar.')
    } finally {
      setProcessando(false)
    }
  }

  async function confirmarRemarcacao() {
    if (!novoHorario) {
      toast.erro('Escolha um novo horário.')
      return
    }
    setProcessando(true)
    try {
      await agendamentoService.remarcar(paraRemarcar.id, { data: novaData, horario: novoHorario })
      toast.sucesso('Agendamento remarcado.')
      setParaRemarcar(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível remarcar.')
    } finally {
      setProcessando(false)
    }
  }

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  const lista = listas[aba]

  return (
    <>
      <CabecalhoPagina
        titulo="Meus agendamentos"
        subtitulo="Acompanhe, remarque ou cancele seus horários."
        acao={
          <Link className="btn btn--primario" to="/agendar">
            Novo agendamento
          </Link>
        }
      />

      <div className="linha" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {ABAS.map((item) => (
          <Botao
            key={item.chave}
            pequeno
            variante={aba === item.chave ? 'primario' : 'contorno'}
            onClick={() => setAba(item.chave)}
          >
            {item.rotulo} ({listas[item.chave].length})
          </Botao>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio
          icone="📅"
          titulo="Nada por aqui"
          descricao={
            aba === 'PROXIMOS'
              ? 'Você ainda não tem horários confirmados.'
              : 'Nenhum registro nesta situação.'
          }
          acao={
            aba === 'PROXIMOS' ? (
              <Link className="btn btn--primario" to="/agendar">
                Agendar horário
              </Link>
            ) : null
          }
        />
      ) : (
        <div className="lista">
          {lista.map((agendamento) => {
            const status = rotuloStatus(agendamento.status)
            return (
              <article className="item" key={agendamento.id}>
                <div className="item__principal">
                  <span className="item__titulo">{agendamento.servicoNome}</span>
                  <span className="item__meta">
                    <span>📅 {data(agendamento.data)}</span>
                    <span>🕐 {hora(agendamento.horario)} – {hora(agendamento.horarioFim)}</span>
                    <span>✂️ {agendamento.barbeiroNome}</span>
                    <span>💰 {moeda(agendamento.valor)}</span>
                  </span>
                </div>
                <div className="item__acoes">
                  <Etiqueta tom={status.classe.replace('badge--', '')}>{status.texto}</Etiqueta>
                  {agendamento.status === 'CONFIRMADO' && (
                    <>
                      <Botao pequeno variante="contorno" onClick={() => abrirRemarcacao(agendamento)}>
                        Remarcar
                      </Botao>
                      <Botao pequeno variante="perigo" onClick={() => setParaCancelar(agendamento)}>
                        Cancelar
                      </Botao>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Confirmacao
        aberto={Boolean(paraCancelar)}
        titulo="Cancelar agendamento"
        mensagem={
          paraCancelar
            ? `Confirma o cancelamento de ${paraCancelar.servicoNome} em ${data(paraCancelar.data)} às ${hora(paraCancelar.horario)}?`
            : ''
        }
        textoConfirmar="Cancelar agendamento"
        carregando={processando}
        onConfirmar={confirmarCancelamento}
        onFechar={() => setParaCancelar(null)}
      />

      <Modal
        aberto={Boolean(paraRemarcar)}
        titulo="Remarcar agendamento"
        onFechar={() => setParaRemarcar(null)}
        rodape={
          <>
            <Botao variante="contorno" onClick={() => setParaRemarcar(null)}>
              Voltar
            </Botao>
            <Botao variante="primario" onClick={confirmarRemarcacao} carregando={processando}>
              Confirmar
            </Botao>
          </>
        }
      >
        {paraRemarcar && (
          <div className="pilha">
            <Cartao>
              <strong>{paraRemarcar.servicoNome}</strong>
              <div className="texto-suave">com {paraRemarcar.barbeiroNome}</div>
              <div className="texto-fraco">
                Atual: {data(paraRemarcar.data)} às {hora(paraRemarcar.horario)}
              </div>
            </Cartao>

            <Campo rotulo="Nova data" htmlFor="nova-data">
              <Entrada
                id="nova-data"
                type="date"
                value={novaData}
                min={hojeISO()}
                onChange={(e) => {
                  setNovaData(e.target.value)
                  setNovoHorario('')
                  carregarHorarios(paraRemarcar, e.target.value)
                }}
              />
            </Campo>

            <Campo rotulo="Novo horário">
              {buscandoHorarios ? (
                <Carregando texto="Buscando horários..." />
              ) : horariosLivres.length ? (
                <div className="grade-horarios">
                  {horariosLivres.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`horario ${novoHorario === h ? 'selecionado' : ''}`}
                      onClick={() => setNovoHorario(h)}
                    >
                      {hora(h)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="texto-suave">Nenhum horário livre nesta data.</p>
              )}
            </Campo>
          </div>
        )}
      </Modal>
    </>
  )
}
