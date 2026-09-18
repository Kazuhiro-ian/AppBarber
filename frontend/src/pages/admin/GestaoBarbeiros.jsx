import { useState } from 'react'
import { barbeiroService } from '../../services/barbeiroService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Modal } from '../../components/ui/Modal'
import { Avatar } from '../../components/ui/Avatar'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { fimDoMes, hora, inicioDoMes, moeda } from '../../utils/formato'

const NOVO_VAZIO = {
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  horarioInicio: '09:00',
  horarioFim: '19:00',
  comissao: 40,
  especialidades: '',
}

/** Cadastro de barbeiros, ajuste de comissão/jornada e consulta de comissões. */
export default function GestaoBarbeiros() {
  const toast = useToast()
  const { dados, carregando, erro, recarregar } = useCarregar(() => barbeiroService.listarTodos(), [])

  const [modalNovo, setModalNovo] = useState(false)
  const [novo, setNovo] = useState(NOVO_VAZIO)
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const [editando, setEditando] = useState(null)
  const [edicao, setEdicao] = useState({ horarioInicio: '', horarioFim: '', comissao: 0 })

  const [comissaoDe, setComissaoDe] = useState(null)
  const [comissao, setComissao] = useState(null)

  function validarNovo() {
    const novosErros = {}
    if (!novo.nome.trim()) novosErros.nome = 'Informe o nome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(novo.email.trim())) novosErros.email = 'E-mail inválido.'
    if (novo.senha.length < 6) novosErros.senha = 'A senha precisa ter ao menos 6 caracteres.'
    if (novo.horarioInicio >= novo.horarioFim) novosErros.horarioFim = 'O fim deve ser depois do início.'
    setErros(novosErros)
    return Object.keys(novosErros).length === 0
  }

  async function cadastrar(evento) {
    evento.preventDefault()
    if (!validarNovo()) return
    setSalvando(true)
    try {
      await barbeiroService.cadastrar({
        nome: novo.nome.trim(),
        email: novo.email.trim(),
        senha: novo.senha,
        telefone: novo.telefone.trim() || null,
        horarioInicio: `${novo.horarioInicio}:00`,
        horarioFim: `${novo.horarioFim}:00`,
        comissao: Number(novo.comissao),
        especialidades: novo.especialidades
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      })
      toast.sucesso('Barbeiro cadastrado.')
      setModalNovo(false)
      setNovo(NOVO_VAZIO)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível cadastrar o barbeiro.')
    } finally {
      setSalvando(false)
    }
  }

  function abrirEdicao(barbeiro) {
    setEditando(barbeiro)
    setEdicao({
      horarioInicio: hora(barbeiro.horarioInicio) === '—' ? '' : hora(barbeiro.horarioInicio),
      horarioFim: hora(barbeiro.horarioFim) === '—' ? '' : hora(barbeiro.horarioFim),
      comissao: Number(barbeiro.comissao ?? 0),
    })
  }

  async function salvarEdicao(evento) {
    evento.preventDefault()
    setSalvando(true)
    try {
      await barbeiroService.atualizar(editando.id, {
        horarioInicio: edicao.horarioInicio ? `${edicao.horarioInicio}:00` : null,
        horarioFim: edicao.horarioFim ? `${edicao.horarioFim}:00` : null,
        comissao: Number(edicao.comissao),
      })
      toast.sucesso('Dados do barbeiro atualizados.')
      setEditando(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  async function alternarStatus(barbeiro) {
    try {
      await barbeiroService.alterarStatus(barbeiro.id, !barbeiro.ativo)
      toast.sucesso(barbeiro.ativo ? 'Barbeiro inativado.' : 'Barbeiro reativado.')
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível alterar o status.')
    }
  }

  async function verComissao(barbeiro) {
    setComissaoDe(barbeiro)
    setComissao(null)
    try {
      const resultado = await barbeiroService.comissao({
        barbeiroId: barbeiro.id,
        inicio: inicioDoMes(),
        fim: fimDoMes(),
      })
      setComissao(resultado)
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível calcular a comissão.')
      setComissaoDe(null)
    }
  }

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  return (
    <>
      <CabecalhoPagina
        titulo="Barbeiros"
        subtitulo="Equipe, jornada de trabalho e percentual de comissão."
        acao={
          <Botao variante="primario" onClick={() => setModalNovo(true)}>
            Novo barbeiro
          </Botao>
        }
      />

      {dados?.length ? (
        <div className="grade grade--2">
          {dados.map((barbeiro) => (
            <Cartao key={barbeiro.id}>
              <div className="linha" style={{ gap: 12, alignItems: 'flex-start' }}>
                <Avatar nome={barbeiro.nome} foto={barbeiro.fotoPerfil} />
                <div className="item__principal">
                  <span className="item__titulo">{barbeiro.nome}</span>
                  <span className="item__meta">
                    <span>{barbeiro.email}</span>
                    {barbeiro.telefone && <span>{barbeiro.telefone}</span>}
                  </span>
                  <span className="item__meta">
                    <span>🕐 {hora(barbeiro.horarioInicio)} às {hora(barbeiro.horarioFim)}</span>
                    <span>💰 {Number(barbeiro.comissao ?? 0).toFixed(2)}% de comissão</span>
                  </span>
                  {barbeiro.especialidades?.length > 0 && (
                    <div className="linha" style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {barbeiro.especialidades.map((e) => (
                        <Etiqueta key={e}>{e}</Etiqueta>
                      ))}
                    </div>
                  )}
                </div>
                <Etiqueta tom={barbeiro.ativo ? 'sucesso' : 'erro'}>
                  {barbeiro.ativo ? 'Ativo' : 'Inativo'}
                </Etiqueta>
              </div>

              <div className="item__acoes" style={{ marginTop: 14 }}>
                <Botao pequeno variante="contorno" onClick={() => abrirEdicao(barbeiro)}>
                  Editar
                </Botao>
                <Botao pequeno variante="contorno" onClick={() => verComissao(barbeiro)}>
                  Comissão do mês
                </Botao>
                <Botao
                  pequeno
                  variante={barbeiro.ativo ? 'perigo' : 'sucesso'}
                  onClick={() => alternarStatus(barbeiro)}
                >
                  {barbeiro.ativo ? 'Inativar' : 'Reativar'}
                </Botao>
              </div>
            </Cartao>
          ))}
        </div>
      ) : (
        <Vazio icone="✂️" titulo="Nenhum barbeiro cadastrado" />
      )}

      <Modal aberto={modalNovo} titulo="Novo barbeiro" onFechar={() => setModalNovo(false)}>
        <form className="pilha" onSubmit={cadastrar}>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Nome" erro={erros.nome} htmlFor="b-nome">
              <Entrada
                id="b-nome"
                value={novo.nome}
                erro={erros.nome}
                onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Telefone" htmlFor="b-tel">
              <Entrada
                id="b-tel"
                value={novo.telefone}
                onChange={(e) => setNovo({ ...novo, telefone: e.target.value })}
              />
            </Campo>
          </div>
          <div className="form-grade form-grade--2">
            <Campo rotulo="E-mail de acesso" erro={erros.email} htmlFor="b-email">
              <Entrada
                id="b-email"
                type="email"
                value={novo.email}
                erro={erros.email}
                onChange={(e) => setNovo({ ...novo, email: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Senha provisória" erro={erros.senha} htmlFor="b-senha">
              <Entrada
                id="b-senha"
                type="password"
                value={novo.senha}
                erro={erros.senha}
                onChange={(e) => setNovo({ ...novo, senha: e.target.value })}
              />
            </Campo>
          </div>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Início do expediente" htmlFor="b-ini">
              <Entrada
                id="b-ini"
                type="time"
                value={novo.horarioInicio}
                onChange={(e) => setNovo({ ...novo, horarioInicio: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Fim do expediente" erro={erros.horarioFim} htmlFor="b-fim">
              <Entrada
                id="b-fim"
                type="time"
                erro={erros.horarioFim}
                value={novo.horarioFim}
                onChange={(e) => setNovo({ ...novo, horarioFim: e.target.value })}
              />
            </Campo>
          </div>
          <Campo rotulo="Comissão (%)" htmlFor="b-com">
            <Entrada
              id="b-com"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={novo.comissao}
              onChange={(e) => setNovo({ ...novo, comissao: e.target.value })}
            />
          </Campo>
          <Campo rotulo="Especialidades" dica="Separe por vírgula." htmlFor="b-esp">
            <Entrada
              id="b-esp"
              placeholder="Corte degradê, Barba, Navalhado"
              value={novo.especialidades}
              onChange={(e) => setNovo({ ...novo, especialidades: e.target.value })}
            />
          </Campo>
          <div className="form-acoes">
            <Botao variante="contorno" onClick={() => setModalNovo(false)}>
              Cancelar
            </Botao>
            <Botao tipo="submit" variante="primario" carregando={salvando}>
              Cadastrar
            </Botao>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={Boolean(editando)}
        titulo={editando ? `Editar ${editando.nome}` : ''}
        onFechar={() => setEditando(null)}
      >
        <form className="pilha" onSubmit={salvarEdicao}>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Início do expediente" htmlFor="e-ini">
              <Entrada
                id="e-ini"
                type="time"
                value={edicao.horarioInicio}
                onChange={(e) => setEdicao({ ...edicao, horarioInicio: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Fim do expediente" htmlFor="e-fim">
              <Entrada
                id="e-fim"
                type="time"
                value={edicao.horarioFim}
                onChange={(e) => setEdicao({ ...edicao, horarioFim: e.target.value })}
              />
            </Campo>
          </div>
          <Campo rotulo="Comissão (%)" htmlFor="e-com">
            <Entrada
              id="e-com"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={edicao.comissao}
              onChange={(e) => setEdicao({ ...edicao, comissao: e.target.value })}
            />
          </Campo>
          <div className="form-acoes">
            <Botao variante="contorno" onClick={() => setEditando(null)}>
              Cancelar
            </Botao>
            <Botao tipo="submit" variante="primario" carregando={salvando}>
              Salvar
            </Botao>
          </div>
        </form>
      </Modal>

      <Modal
        aberto={Boolean(comissaoDe)}
        titulo={comissaoDe ? `Comissão de ${comissaoDe.nome}` : ''}
        onFechar={() => setComissaoDe(null)}
      >
        {comissao ? (
          <div className="pilha">
            <div className="grade grade--2">
              <div className="stat">
                <span className="stat__rotulo">Atendimentos</span>
                <strong className="stat__valor">{comissao.atendimentosConcluidos}</strong>
              </div>
              <div className="stat">
                <span className="stat__rotulo">Faturamento</span>
                <strong className="stat__valor">{moeda(comissao.faturamento)}</strong>
              </div>
            </div>
            <div className="stat stat--marca">
              <span className="stat__rotulo">Comissão a pagar</span>
              <strong className="stat__valor">{moeda(comissao.valorComissao)}</strong>
              <span className="stat__apoio">
                {Number(comissao.percentualComissao ?? 0).toFixed(2)}% sobre o faturamento do mês
              </span>
            </div>
          </div>
        ) : (
          <Carregando />
        )}
      </Modal>
    </>
  )
}
