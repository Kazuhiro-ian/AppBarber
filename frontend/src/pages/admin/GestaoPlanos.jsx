import { useState } from 'react'
import { assinaturaService } from '../../services/assinaturaService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada, Selecao } from '../../components/ui/Campo'
import { Confirmacao, Modal } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { moeda, rotuloPeriodicidade } from '../../utils/formato'

const FORM_VAZIO = {
  nome: '',
  preco: '',
  periodicidade: 'MENSAL',
  beneficios: '',
  ativo: true,
}

/** Catálogo de planos de assinatura mantido pelo administrador. */
export default function GestaoPlanos() {
  const toast = useToast()
  const { dados, carregando, erro, recarregar } = useCarregar(() => assinaturaService.planosGestao(), [])

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [paraRemover, setParaRemover] = useState(null)

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErros({})
    setModalAberto(true)
  }

  function abrirEdicao(plano) {
    setEditando(plano)
    setForm({
      nome: plano.nome,
      preco: plano.preco,
      periodicidade: plano.periodicidade,
      beneficios: (plano.beneficios ?? []).join('\n'),
      ativo: plano.ativo,
    })
    setErros({})
    setModalAberto(true)
  }

  function validar() {
    const novos = {}
    if (!form.nome.trim()) novos.nome = 'Informe o nome do plano.'
    if (form.preco === '' || Number(form.preco) < 0) novos.preco = 'Informe um preço válido.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!validar()) return

    const corpo = {
      nome: form.nome.trim(),
      preco: Number(form.preco),
      periodicidade: form.periodicidade,
      beneficios: form.beneficios
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      ativo: form.ativo,
    }

    setSalvando(true)
    try {
      if (editando) {
        await assinaturaService.editarPlano(editando.id, corpo)
        toast.sucesso('Plano atualizado.')
      } else {
        await assinaturaService.criarPlano(corpo)
        toast.sucesso('Plano criado.')
      }
      setModalAberto(false)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar o plano.')
    } finally {
      setSalvando(false)
    }
  }

  async function remover() {
    setSalvando(true)
    try {
      await assinaturaService.removerPlano(paraRemover.id)
      toast.sucesso(
        paraRemover.assinantesAtivos > 0
          ? 'Plano desativado (há assinantes ativos).'
          : 'Plano removido.',
      )
      setParaRemover(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível remover.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  return (
    <>
      <CabecalhoPagina
        titulo="Planos de assinatura"
        subtitulo="Cada contratação gera uma cópia do plano com vigência própria do cliente."
        acao={
          <Botao variante="primario" onClick={abrirNovo}>
            Novo plano
          </Botao>
        }
      />

      {dados?.length ? (
        <div className="grade grade--3">
          {dados.map((plano) => (
            <Cartao
              key={plano.id}
              titulo={plano.nome}
              acao={
                <Etiqueta tom={plano.ativo ? 'sucesso' : 'erro'}>
                  {plano.ativo ? 'Disponível' : 'Indisponível'}
                </Etiqueta>
              }
            >
              <div className="pilha" style={{ gap: 10 }}>
                <div className="opcao__preco" style={{ fontSize: '1.3rem' }}>
                  {moeda(plano.preco)}
                  <span className="texto-fraco"> {rotuloPeriodicidade(plano.periodicidade)}</span>
                </div>
                <span className="texto-suave">
                  {plano.assinantesAtivos} assinante(s) ativo(s)
                </span>
                {plano.beneficios?.length > 0 && (
                  <ul className="texto-suave" style={{ paddingLeft: 18, margin: 0, fontSize: '0.88rem' }}>
                    {plano.beneficios.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                )}
                <div className="item__acoes">
                  <Botao pequeno variante="contorno" onClick={() => abrirEdicao(plano)}>
                    Editar
                  </Botao>
                  <Botao pequeno variante="perigo" onClick={() => setParaRemover(plano)}>
                    Remover
                  </Botao>
                </div>
              </div>
            </Cartao>
          ))}
        </div>
      ) : (
        <Vazio
          icone="⭐"
          titulo="Nenhum plano cadastrado"
          acao={
            <Botao variante="primario" onClick={abrirNovo}>
              Criar primeiro plano
            </Botao>
          }
        />
      )}

      <Modal
        aberto={modalAberto}
        titulo={editando ? 'Editar plano' : 'Novo plano'}
        onFechar={() => setModalAberto(false)}
      >
        <form className="pilha" onSubmit={salvar}>
          <Campo rotulo="Nome do plano" erro={erros.nome} htmlFor="pl-nome">
            <Entrada
              id="pl-nome"
              value={form.nome}
              erro={erros.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Campo>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Preço (R$)" erro={erros.preco} htmlFor="pl-preco">
              <Entrada
                id="pl-preco"
                type="number"
                min="0"
                step="0.01"
                erro={erros.preco}
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Periodicidade" htmlFor="pl-per">
              <Selecao
                id="pl-per"
                value={form.periodicidade}
                onChange={(e) => setForm({ ...form, periodicidade: e.target.value })}
              >
                <option value="MENSAL">Mensal</option>
                <option value="TRIMESTRAL">Trimestral</option>
                <option value="ANUAL">Anual</option>
              </Selecao>
            </Campo>
          </div>
          <Campo rotulo="Benefícios" dica="Um benefício por linha." htmlFor="pl-ben">
            <textarea
              id="pl-ben"
              className="campo__controle"
              rows={5}
              placeholder={'2 cortes por mês\n10% de desconto em produtos'}
              value={form.beneficios}
              onChange={(e) => setForm({ ...form, beneficios: e.target.value })}
            />
          </Campo>
          <label className="linha" style={{ gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            <span className="texto-suave">Disponível para contratação</span>
          </label>
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
        aberto={Boolean(paraRemover)}
        titulo="Remover plano"
        mensagem={
          paraRemover?.assinantesAtivos > 0
            ? `"${paraRemover.nome}" tem ${paraRemover.assinantesAtivos} assinante(s) ativo(s), então será apenas desativado — as assinaturas em andamento continuam valendo.`
            : `O plano "${paraRemover?.nome}" será removido do catálogo.`
        }
        textoConfirmar="Remover"
        carregando={salvando}
        onConfirmar={remover}
        onFechar={() => setParaRemover(null)}
      />
    </>
  )
}
