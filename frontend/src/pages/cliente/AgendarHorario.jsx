import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { agendamentoService } from '../../services/agendamentoService'
import { barbeiroService } from '../../services/barbeiroService'
import { servicoService } from '../../services/servicoService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { duracao, hojeISO, hora, moeda, somarDias } from '../../utils/formato'

/**
 * Fluxo de agendamento em 4 passos: serviço → barbeiro → data → horário.
 * A grade de horários vem pronta do backend, já descontando a duração do
 * serviço e os atendimentos confirmados do barbeiro.
 */
export default function AgendarHorario() {
  const navegar = useNavigate()
  const toast = useToast()

  const [servicoId, setServicoId] = useState(null)
  const [barbeiroId, setBarbeiroId] = useState(null)
  const [dataEscolhida, setDataEscolhida] = useState(hojeISO())
  const [horario, setHorario] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const servicos = useCarregar(() => servicoService.listar({ apenasAtivos: true }), [])
  const barbeiros = useCarregar(() => barbeiroService.listar(), [])

  const [grade, setGrade] = useState(null)
  const [carregandoGrade, setCarregandoGrade] = useState(false)
  const [erroGrade, setErroGrade] = useState('')

  // Troca de serviço/barbeiro/data invalida o horário que estava selecionado.
  useEffect(() => setHorario(null), [servicoId, barbeiroId, dataEscolhida])

  useEffect(() => {
    if (!servicoId || !barbeiroId || !dataEscolhida) {
      setGrade(null)
      return
    }
    let ativo = true
    setCarregandoGrade(true)
    setErroGrade('')
    agendamentoService
      .disponibilidade({ barbeiroId, servicoId, data: dataEscolhida })
      .then((resposta) => ativo && setGrade(resposta))
      .catch((e) => ativo && setErroGrade(e.mensagem || 'Não foi possível carregar os horários.'))
      .finally(() => ativo && setCarregandoGrade(false))
    return () => {
      ativo = false
    }
  }, [servicoId, barbeiroId, dataEscolhida])

  const servicoSelecionado = useMemo(
    () => servicos.dados?.find((s) => s.id === servicoId) ?? null,
    [servicos.dados, servicoId],
  )
  const barbeiroSelecionado = useMemo(
    () => barbeiros.dados?.find((b) => b.id === barbeiroId) ?? null,
    [barbeiros.dados, barbeiroId],
  )

  async function confirmar() {
    if (!servicoId || !barbeiroId || !dataEscolhida || !horario) return
    setEnviando(true)
    try {
      await agendamentoService.agendar({ servicoId, barbeiroId, data: dataEscolhida, horario })
      toast.sucesso('Horário agendado com sucesso!')
      navegar('/meus-agendamentos')
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível concluir o agendamento.')
    } finally {
      setEnviando(false)
    }
  }

  if (servicos.carregando || barbeiros.carregando) return <Carregando />
  if (servicos.erro) return <Erro mensagem={servicos.erro} onTentarNovamente={servicos.recarregar} />
  if (barbeiros.erro) return <Erro mensagem={barbeiros.erro} onTentarNovamente={barbeiros.recarregar} />

  return (
    <>
      <CabecalhoPagina titulo="Agendar horário" subtitulo="Escolha o serviço, o profissional e o melhor horário." />

      <div className="pilha">
        <Cartao titulo="1. Escolha o serviço">
          {servicos.dados?.length ? (
            <div className="grade grade--auto">
              {servicos.dados.map((servico) => (
                <button
                  key={servico.id}
                  type="button"
                  className={`opcao ${servicoId === servico.id ? 'selecionada' : ''}`}
                  onClick={() => setServicoId(servico.id)}
                >
                  <span className="opcao__info">
                    <span className="opcao__nome">{servico.nome}</span>
                    <span className="opcao__detalhe">
                      {servico.categoria} · {duracao(servico.duracaoMinutos)}
                    </span>
                  </span>
                  <span className="opcao__preco">{moeda(servico.preco)}</span>
                </button>
              ))}
            </div>
          ) : (
            <Vazio icone="💈" titulo="Nenhum serviço disponível" />
          )}
        </Cartao>

        <Cartao titulo="2. Escolha o barbeiro">
          {barbeiros.dados?.length ? (
            <div className="grade grade--auto">
              {barbeiros.dados.map((barbeiro) => (
                <button
                  key={barbeiro.id}
                  type="button"
                  className={`opcao ${barbeiroId === barbeiro.id ? 'selecionada' : ''}`}
                  onClick={() => setBarbeiroId(barbeiro.id)}
                >
                  <span className="opcao__info">
                    <span className="opcao__nome">{barbeiro.nome}</span>
                    <span className="opcao__detalhe">
                      {barbeiro.especialidades?.length
                        ? barbeiro.especialidades.join(' · ')
                        : 'Atendimento geral'}
                    </span>
                    <span className="opcao__detalhe">
                      {hora(barbeiro.horarioInicio)} às {hora(barbeiro.horarioFim)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <Vazio icone="✂️" titulo="Nenhum barbeiro disponível no momento" />
          )}
        </Cartao>

        <Cartao titulo="3. Escolha a data">
          <div className="filtros" style={{ marginBottom: 0 }}>
            <Campo rotulo="Data do atendimento" htmlFor="data">
              <Entrada
                id="data"
                type="date"
                value={dataEscolhida}
                min={hojeISO()}
                max={somarDias(hojeISO(), 90)}
                onChange={(e) => setDataEscolhida(e.target.value)}
              />
            </Campo>
            <div className="linha" style={{ gap: 8 }}>
              <Botao pequeno variante="contorno" onClick={() => setDataEscolhida(hojeISO())}>
                Hoje
              </Botao>
              <Botao pequeno variante="contorno" onClick={() => setDataEscolhida(somarDias(hojeISO(), 1))}>
                Amanhã
              </Botao>
            </div>
          </div>
        </Cartao>

        <Cartao titulo="4. Escolha o horário">
          {!servicoId || !barbeiroId ? (
            <p className="texto-suave">Selecione o serviço e o barbeiro para ver os horários livres.</p>
          ) : carregandoGrade ? (
            <Carregando texto="Buscando horários..." />
          ) : erroGrade ? (
            <Erro mensagem={erroGrade} />
          ) : grade?.horariosDisponiveis?.length ? (
            <>
              <div className="grade-horarios">
                {grade.horariosDisponiveis.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`horario ${horario === h ? 'selecionado' : ''}`}
                    onClick={() => setHorario(h)}
                  >
                    {hora(h)}
                  </button>
                ))}
              </div>
              {grade.horariosOcupados?.length > 0 && (
                <p className="texto-fraco" style={{ marginTop: 12 }}>
                  Já reservados: {grade.horariosOcupados.map(hora).join(', ')}
                </p>
              )}
            </>
          ) : (
            <Vazio
              icone="🕐"
              titulo="Nenhum horário livre nesta data"
              descricao="Tente outro dia ou escolha outro profissional."
            />
          )}
        </Cartao>

        {servicoSelecionado && barbeiroSelecionado && horario && (
          <Cartao destaque titulo="Confirme o agendamento">
            <div className="linha-entre">
              <div className="pilha" style={{ gap: 4 }}>
                <strong>{servicoSelecionado.nome}</strong>
                <span className="texto-suave">
                  {barbeiroSelecionado.nome} · {dataEscolhida.split('-').reverse().join('/')} às{' '}
                  {hora(horario)}
                </span>
                <span className="texto-suave">
                  Duração de {duracao(servicoSelecionado.duracaoMinutos)}
                </span>
              </div>
              <Etiqueta tom="marca">{moeda(servicoSelecionado.preco)}</Etiqueta>
            </div>
            <div className="form-acoes" style={{ marginTop: 16 }}>
              <Botao variante="primario" onClick={confirmar} carregando={enviando}>
                Confirmar agendamento
              </Botao>
            </div>
          </Cartao>
        )}
      </div>
    </>
  )
}
