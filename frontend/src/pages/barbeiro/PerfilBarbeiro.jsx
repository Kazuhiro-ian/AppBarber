import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { barbeiroService } from '../../services/barbeiroService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Carregando, Erro } from '../../components/ui/Estados'
import { data, fimDoMes, hora, inicioDoMes, moeda } from '../../utils/formato'

/** Perfil profissional: jornada, especialidades e comissão do período. */
export default function PerfilBarbeiro() {
  const toast = useToast()
  const perfil = useCarregar(() => barbeiroService.meuPerfil(), [])

  const [inicio, setInicio] = useState(inicioDoMes())
  const [fim, setFim] = useState(fimDoMes())
  const comissao = useCarregar(() => barbeiroService.comissao({ inicio, fim }), [inicio, fim])

  const [form, setForm] = useState({ horarioInicio: '', horarioFim: '' })
  const [especialidades, setEspecialidades] = useState([])
  const [nova, setNova] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!perfil.dados) return
    setForm({
      horarioInicio: hora(perfil.dados.horarioInicio) === '—' ? '' : hora(perfil.dados.horarioInicio),
      horarioFim: hora(perfil.dados.horarioFim) === '—' ? '' : hora(perfil.dados.horarioFim),
    })
    setEspecialidades(perfil.dados.especialidades ?? [])
  }, [perfil.dados])

  function adicionarEspecialidade() {
    const valor = nova.trim()
    if (!valor) return
    if (especialidades.some((e) => e.toLowerCase() === valor.toLowerCase())) {
      toast.erro('Essa especialidade já está na lista.')
      return
    }
    setEspecialidades([...especialidades, valor])
    setNova('')
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (form.horarioInicio && form.horarioFim && form.horarioInicio >= form.horarioFim) {
      toast.erro('O horário de início deve ser anterior ao de término.')
      return
    }
    setSalvando(true)
    try {
      await barbeiroService.atualizarMeuPerfil({
        especialidades,
        horarioInicio: form.horarioInicio ? `${form.horarioInicio}:00` : null,
        horarioFim: form.horarioFim ? `${form.horarioFim}:00` : null,
      })
      toast.sucesso('Perfil profissional atualizado.')
      perfil.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (perfil.carregando) return <Carregando />
  if (perfil.erro) return <Erro mensagem={perfil.erro} onTentarNovamente={perfil.recarregar} />

  return (
    <>
      <CabecalhoPagina
        titulo="Perfil profissional"
        subtitulo="Defina sua jornada e as especialidades que aparecem para o cliente."
        acao={
          <Link className="btn btn--contorno" to="/perfil">
            Dados da conta
          </Link>
        }
      />

      <div className="pilha">
        <div className="grade grade--3">
          <Indicador
            rotulo="Situação"
            valor={perfil.dados.ativo ? 'Ativo' : 'Inativo'}
            apoio={perfil.dados.ativo ? 'Recebendo agendamentos' : 'Fora da lista de agendamento'}
            tom={perfil.dados.ativo ? 'sucesso' : 'erro'}
          />
          <Indicador
            rotulo="Comissão"
            valor={`${Number(perfil.dados.comissao ?? 0).toFixed(2)}%`}
            apoio="Definida pelo administrador"
          />
          <Indicador
            rotulo="Jornada"
            valor={`${hora(perfil.dados.horarioInicio)} – ${hora(perfil.dados.horarioFim)}`}
            apoio="Intervalo em que você recebe agendamentos"
          />
        </div>

        <Cartao titulo="Horário de trabalho e especialidades">
          <form className="pilha" onSubmit={salvar}>
            <div className="form-grade form-grade--2">
              <Campo rotulo="Início do expediente" htmlFor="inicio">
                <Entrada
                  id="inicio"
                  type="time"
                  value={form.horarioInicio}
                  onChange={(e) => setForm({ ...form, horarioInicio: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Fim do expediente" htmlFor="fim">
                <Entrada
                  id="fim"
                  type="time"
                  value={form.horarioFim}
                  onChange={(e) => setForm({ ...form, horarioFim: e.target.value })}
                />
              </Campo>
            </div>

            <Campo rotulo="Especialidades" dica="Elas aparecem para o cliente na hora de escolher o barbeiro.">
              <div className="linha" style={{ gap: 8 }}>
                <Entrada
                  placeholder="Ex.: Corte degradê"
                  value={nova}
                  onChange={(e) => setNova(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      adicionarEspecialidade()
                    }
                  }}
                />
                <Botao variante="contorno" onClick={adicionarEspecialidade}>
                  Adicionar
                </Botao>
              </div>
            </Campo>

            {especialidades.length > 0 && (
              <div className="linha" style={{ flexWrap: 'wrap', gap: 8 }}>
                {especialidades.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="badge badge--marca"
                    title="Remover"
                    style={{ border: 'none', cursor: 'pointer' }}
                    onClick={() => setEspecialidades(especialidades.filter((e) => e !== item))}
                  >
                    {item} ×
                  </button>
                ))}
              </div>
            )}

            <div className="form-acoes">
              <Botao tipo="submit" variante="primario" carregando={salvando}>
                Salvar perfil
              </Botao>
            </div>
          </form>
        </Cartao>

        <Cartao titulo="Minha comissão no período">
          <div className="filtros">
            <Campo rotulo="De" htmlFor="de">
              <Entrada id="de" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </Campo>
            <Campo rotulo="Até" htmlFor="ate">
              <Entrada id="ate" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </Campo>
          </div>

          {comissao.carregando ? (
            <Carregando />
          ) : comissao.erro ? (
            <Erro mensagem={comissao.erro} onTentarNovamente={comissao.recarregar} />
          ) : (
            <>
              <div className="grade grade--3">
                <Indicador
                  rotulo="Atendimentos concluídos"
                  valor={comissao.dados.atendimentosConcluidos}
                />
                <Indicador rotulo="Faturamento gerado" valor={moeda(comissao.dados.faturamento)} />
                <Indicador
                  rotulo="Comissão a receber"
                  valor={moeda(comissao.dados.valorComissao)}
                  apoio={`${Number(comissao.dados.percentualComissao ?? 0).toFixed(2)}% do faturamento`}
                  tom="marca"
                />
              </div>
              <p className="texto-fraco" style={{ marginTop: 12 }}>
                Período de {data(comissao.dados.periodoInicio)} a {data(comissao.dados.periodoFim)}.{' '}
                <Etiqueta>Somente atendimentos concluídos entram no cálculo</Etiqueta>
              </p>
            </>
          )}
        </Cartao>
      </div>
    </>
  )
}
