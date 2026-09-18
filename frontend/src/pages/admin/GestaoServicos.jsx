import { useState } from 'react'
import { servicoService } from '../../services/servicoService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Confirmacao, Modal } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { duracao, moeda } from '../../utils/formato'

const FORM_VAZIO = { nome: '', categoria: '', duracaoMinutos: 30, preco: '' }

/** CRUD de serviços. A exclusão é lógica (inativa) para preservar o histórico. */
export default function GestaoServicos() {
  const toast = useToast()
  const { dados, carregando, erro, recarregar } = useCarregar(
    () => servicoService.listar({ apenasAtivos: false }),
    [],
  )

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [paraInativar, setParaInativar] = useState(null)

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErros({})
    setModalAberto(true)
  }

  function abrirEdicao(servico) {
    setEditando(servico)
    setForm({
      nome: servico.nome,
      categoria: servico.categoria ?? '',
      duracaoMinutos: servico.duracaoMinutos,
      preco: servico.preco,
    })
    setErros({})
    setModalAberto(true)
  }

  function validar() {
    const novos = {}
    if (!form.nome.trim()) novos.nome = 'Informe o nome do serviço.'
    if (Number(form.duracaoMinutos) < 5) novos.duracaoMinutos = 'A duração mínima é de 5 minutos.'
    if (form.preco === '' || Number(form.preco) < 0) novos.preco = 'Informe um preço válido.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!validar()) return

    const corpo = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      duracaoMinutos: Number(form.duracaoMinutos),
      preco: Number(form.preco),
      ativo: editando ? editando.ativo : true,
    }

    setSalvando(true)
    try {
      if (editando) {
        await servicoService.editar(editando.id, corpo)
        toast.sucesso('Serviço atualizado.')
      } else {
        await servicoService.cadastrar(corpo)
        toast.sucesso('Serviço cadastrado.')
      }
      setModalAberto(false)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar o serviço.')
    } finally {
      setSalvando(false)
    }
  }

  async function inativar() {
    setSalvando(true)
    try {
      await servicoService.inativar(paraInativar.id)
      toast.sucesso('Serviço inativado.')
      setParaInativar(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível inativar.')
    } finally {
      setSalvando(false)
    }
  }

  async function reativar(servico) {
    try {
      await servicoService.reativar(servico.id)
      toast.sucesso('Serviço reativado.')
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível reativar.')
    }
  }

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  return (
    <>
      <CabecalhoPagina
        titulo="Serviços"
        subtitulo="Catálogo que o cliente vê na hora de agendar."
        acao={
          <Botao variante="primario" onClick={abrirNovo}>
            Novo serviço
          </Botao>
        }
      />

      <Cartao>
        {dados?.length ? (
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Serviço</th>
                  <th>Categoria</th>
                  <th>Duração</th>
                  <th className="numerico">Preço</th>
                  <th>Situação</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dados.map((servico) => (
                  <tr key={servico.id}>
                    <td>{servico.nome}</td>
                    <td className="texto-suave">{servico.categoria || '—'}</td>
                    <td>{duracao(servico.duracaoMinutos)}</td>
                    <td className="numerico">{moeda(servico.preco)}</td>
                    <td>
                      <Etiqueta tom={servico.ativo ? 'sucesso' : 'erro'}>
                        {servico.ativo ? 'Ativo' : 'Inativo'}
                      </Etiqueta>
                    </td>
                    <td>
                      <div className="item__acoes">
                        <Botao pequeno variante="contorno" onClick={() => abrirEdicao(servico)}>
                          Editar
                        </Botao>
                        {servico.ativo ? (
                          <Botao pequeno variante="perigo" onClick={() => setParaInativar(servico)}>
                            Inativar
                          </Botao>
                        ) : (
                          <Botao pequeno variante="sucesso" onClick={() => reativar(servico)}>
                            Reativar
                          </Botao>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio
            icone="💈"
            titulo="Nenhum serviço cadastrado"
            acao={
              <Botao variante="primario" onClick={abrirNovo}>
                Cadastrar serviço
              </Botao>
            }
          />
        )}
      </Cartao>

      <Modal
        aberto={modalAberto}
        titulo={editando ? 'Editar serviço' : 'Novo serviço'}
        onFechar={() => setModalAberto(false)}
      >
        <form className="pilha" onSubmit={salvar}>
          <Campo rotulo="Nome" erro={erros.nome} htmlFor="nome">
            <Entrada
              id="nome"
              value={form.nome}
              erro={erros.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Campo>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Categoria" htmlFor="categoria">
              <Entrada
                id="categoria"
                placeholder="Cabelo, Barba, Combo..."
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Duração (minutos)" erro={erros.duracaoMinutos} htmlFor="duracao">
              <Entrada
                id="duracao"
                type="number"
                min="5"
                max="480"
                step="5"
                erro={erros.duracaoMinutos}
                value={form.duracaoMinutos}
                onChange={(e) => setForm({ ...form, duracaoMinutos: e.target.value })}
              />
            </Campo>
          </div>
          <Campo rotulo="Preço (R$)" erro={erros.preco} htmlFor="preco">
            <Entrada
              id="preco"
              type="number"
              min="0"
              step="0.01"
              erro={erros.preco}
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
            />
          </Campo>
          <div className="form-acoes">
            <Botao variante="contorno" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao tipo="submit" variante="primario" carregando={salvando}>
              Salvar
            </Botao>
          </div>
        </form>
      </Modal>

      <Confirmacao
        aberto={Boolean(paraInativar)}
        titulo="Inativar serviço"
        mensagem={
          paraInativar
            ? `"${paraInativar.nome}" deixa de aparecer para os clientes, mas o histórico de agendamentos é mantido.`
            : ''
        }
        textoConfirmar="Inativar"
        carregando={salvando}
        onConfirmar={inativar}
        onFechar={() => setParaInativar(null)}
      />
    </>
  )
}
