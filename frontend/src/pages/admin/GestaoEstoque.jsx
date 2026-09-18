import { useMemo, useState } from 'react'
import { produtoService } from '../../services/produtoService'
import { useAuth } from '../../hooks/useAuth'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { Confirmacao, Modal } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { moeda } from '../../utils/formato'

const FORM_VAZIO = {
  nome: '',
  categoria: '',
  quantidade: 0,
  quantidadeMinima: 0,
  precoCusto: '',
  precoVenda: '',
}

/**
 * Estoque de produtos. O ADMIN cadastra, edita, exclui e repõe; o BARBEIRO
 * consulta e dá baixa no consumo do atendimento (mesma regra do backend).
 */
export default function GestaoEstoque() {
  const { perfil } = useAuth()
  const toast = useToast()
  const ehAdmin = perfil === 'ADMIN'

  const [busca, setBusca] = useState('')
  const { dados, carregando, erro, recarregar } = useCarregar(() => produtoService.listar(), [])

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)

  const [movimentacao, setMovimentacao] = useState(null) // { produto, tipo }
  const [quantidade, setQuantidade] = useState(1)
  const [paraExcluir, setParaExcluir] = useState(null)

  const filtrados = useMemo(() => {
    const lista = dados ?? []
    if (!busca.trim()) return lista
    const termo = busca.trim().toLowerCase()
    return lista.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) || (p.categoria ?? '').toLowerCase().includes(termo),
    )
  }, [dados, busca])

  const totais = useMemo(() => {
    const lista = dados ?? []
    return {
      itens: lista.length,
      unidades: lista.reduce((acc, p) => acc + p.quantidade, 0),
      valorEstoque: lista.reduce((acc, p) => acc + p.quantidade * Number(p.precoCusto ?? 0), 0),
      abaixoDoMinimo: lista.filter((p) => p.estoqueBaixo).length,
    }
  }, [dados])

  function abrirNovo() {
    setEditando(null)
    setForm(FORM_VAZIO)
    setErros({})
    setModalAberto(true)
  }

  function abrirEdicao(produto) {
    setEditando(produto)
    setForm({
      nome: produto.nome,
      categoria: produto.categoria ?? '',
      quantidade: produto.quantidade,
      quantidadeMinima: produto.quantidadeMinima,
      precoCusto: produto.precoCusto,
      precoVenda: produto.precoVenda,
    })
    setErros({})
    setModalAberto(true)
  }

  function validar() {
    const novos = {}
    if (!form.nome.trim()) novos.nome = 'Informe o nome do produto.'
    if (Number(form.quantidade) < 0) novos.quantidade = 'A quantidade não pode ser negativa.'
    if (form.precoCusto === '' || Number(form.precoCusto) < 0) novos.precoCusto = 'Informe o custo.'
    if (form.precoVenda === '' || Number(form.precoVenda) < 0) novos.precoVenda = 'Informe o preço de venda.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!validar()) return

    const corpo = {
      nome: form.nome.trim(),
      categoria: form.categoria.trim() || null,
      quantidade: Number(form.quantidade),
      quantidadeMinima: Number(form.quantidadeMinima),
      precoCusto: Number(form.precoCusto),
      precoVenda: Number(form.precoVenda),
    }

    setSalvando(true)
    try {
      if (editando) {
        await produtoService.editar(editando.id, corpo)
        toast.sucesso('Produto atualizado.')
      } else {
        await produtoService.cadastrar(corpo)
        toast.sucesso('Produto cadastrado.')
      }
      setModalAberto(false)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar o produto.')
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarMovimentacao() {
    const unidades = Number(quantidade)
    if (!unidades || unidades < 1) {
      toast.erro('Informe uma quantidade maior que zero.')
      return
    }
    setSalvando(true)
    try {
      if (movimentacao.tipo === 'entrada') {
        await produtoService.repor(movimentacao.produto.id, unidades)
        toast.sucesso('Entrada registrada.')
      } else {
        await produtoService.darBaixa(movimentacao.produto.id, unidades)
        toast.sucesso('Saída registrada.')
      }
      setMovimentacao(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível movimentar o estoque.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setSalvando(true)
    try {
      await produtoService.excluir(paraExcluir.id)
      toast.sucesso('Produto excluído.')
      setParaExcluir(null)
      recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível excluir.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  return (
    <>
      <CabecalhoPagina
        titulo="Gestão de estoque"
        subtitulo={
          ehAdmin
            ? 'Produtos, entradas, saídas e alerta de estoque mínimo.'
            : 'Consulte o estoque e registre o consumo dos atendimentos.'
        }
        acao={
          ehAdmin ? (
            <Botao variante="primario" onClick={abrirNovo}>
              Novo produto
            </Botao>
          ) : null
        }
      />

      <div className="pilha">
        <div className="grade grade--4">
          <Indicador rotulo="Itens cadastrados" valor={totais.itens} />
          <Indicador rotulo="Unidades em estoque" valor={totais.unidades} />
          <Indicador rotulo="Valor imobilizado" valor={moeda(totais.valorEstoque)} apoio="A preço de custo" />
          <Indicador
            rotulo="Abaixo do mínimo"
            valor={totais.abaixoDoMinimo}
            tom={totais.abaixoDoMinimo > 0 ? 'erro' : 'sucesso'}
          />
        </div>

        {totais.abaixoDoMinimo > 0 && (
          <div className="aviso aviso--atencao">
            <span>⚠</span>
            <span>
              {totais.abaixoDoMinimo} produto(s) atingiram o estoque mínimo e precisam de reposição.
            </span>
          </div>
        )}

        <Cartao
          titulo="Produtos"
          acao={
            <Entrada
              placeholder="Buscar por nome ou categoria"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ maxWidth: 260 }}
            />
          }
        >
          {filtrados.length ? (
            <div className="tabela-wrapper">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th className="numerico">Estoque</th>
                    <th className="numerico">Mínimo</th>
                    <th className="numerico">Custo</th>
                    <th className="numerico">Venda</th>
                    <th>Situação</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((produto) => (
                    <tr key={produto.id}>
                      <td>{produto.nome}</td>
                      <td className="texto-suave">{produto.categoria || '—'}</td>
                      <td className="numerico">{produto.quantidade}</td>
                      <td className="numerico texto-suave">{produto.quantidadeMinima}</td>
                      <td className="numerico">{moeda(produto.precoCusto)}</td>
                      <td className="numerico">{moeda(produto.precoVenda)}</td>
                      <td>
                        <Etiqueta tom={produto.estoqueBaixo ? 'erro' : 'sucesso'}>
                          {produto.estoqueBaixo ? 'Repor' : 'Ok'}
                        </Etiqueta>
                      </td>
                      <td>
                        <div className="item__acoes">
                          <Botao
                            pequeno
                            variante="contorno"
                            onClick={() => {
                              setMovimentacao({ produto, tipo: 'saida' })
                              setQuantidade(1)
                            }}
                          >
                            Baixa
                          </Botao>
                          {ehAdmin && (
                            <>
                              <Botao
                                pequeno
                                variante="sucesso"
                                onClick={() => {
                                  setMovimentacao({ produto, tipo: 'entrada' })
                                  setQuantidade(1)
                                }}
                              >
                                Entrada
                              </Botao>
                              <Botao pequeno variante="contorno" onClick={() => abrirEdicao(produto)}>
                                Editar
                              </Botao>
                              <Botao pequeno variante="perigo" onClick={() => setParaExcluir(produto)}>
                                Excluir
                              </Botao>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Vazio icone="📦" titulo="Nenhum produto encontrado" />
          )}
        </Cartao>
      </div>

      <Modal
        aberto={modalAberto}
        titulo={editando ? 'Editar produto' : 'Novo produto'}
        onFechar={() => setModalAberto(false)}
      >
        <form className="pilha" onSubmit={salvar}>
          <Campo rotulo="Nome" erro={erros.nome} htmlFor="p-nome">
            <Entrada
              id="p-nome"
              value={form.nome}
              erro={erros.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Campo>
          <Campo rotulo="Categoria" htmlFor="p-cat">
            <Entrada
              id="p-cat"
              placeholder="Finalizador, Higiene, Insumo..."
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
          </Campo>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Quantidade em estoque" erro={erros.quantidade} htmlFor="p-qtd">
              <Entrada
                id="p-qtd"
                type="number"
                min="0"
                erro={erros.quantidade}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Estoque mínimo" dica="Dispara o alerta de reposição." htmlFor="p-min">
              <Entrada
                id="p-min"
                type="number"
                min="0"
                value={form.quantidadeMinima}
                onChange={(e) => setForm({ ...form, quantidadeMinima: e.target.value })}
              />
            </Campo>
          </div>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Preço de custo (R$)" erro={erros.precoCusto} htmlFor="p-custo">
              <Entrada
                id="p-custo"
                type="number"
                min="0"
                step="0.01"
                erro={erros.precoCusto}
                value={form.precoCusto}
                onChange={(e) => setForm({ ...form, precoCusto: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Preço de venda (R$)" erro={erros.precoVenda} htmlFor="p-venda">
              <Entrada
                id="p-venda"
                type="number"
                min="0"
                step="0.01"
                erro={erros.precoVenda}
                value={form.precoVenda}
                onChange={(e) => setForm({ ...form, precoVenda: e.target.value })}
              />
            </Campo>
          </div>
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

      <Modal
        aberto={Boolean(movimentacao)}
        titulo={movimentacao?.tipo === 'entrada' ? 'Entrada de estoque' : 'Baixa de estoque'}
        onFechar={() => setMovimentacao(null)}
        rodape={
          <>
            <Botao variante="contorno" onClick={() => setMovimentacao(null)}>
              Cancelar
            </Botao>
            <Botao variante="primario" onClick={confirmarMovimentacao} carregando={salvando}>
              Confirmar
            </Botao>
          </>
        }
      >
        {movimentacao && (
          <div className="pilha">
            <p className="texto-suave">
              <strong>{movimentacao.produto.nome}</strong> — estoque atual:{' '}
              {movimentacao.produto.quantidade} unidade(s).
            </p>
            <Campo rotulo="Quantidade" htmlFor="mov-qtd">
              <Entrada
                id="mov-qtd"
                type="number"
                min="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </Campo>
          </div>
        )}
      </Modal>

      <Confirmacao
        aberto={Boolean(paraExcluir)}
        titulo="Excluir produto"
        mensagem={paraExcluir ? `O produto "${paraExcluir.nome}" será removido do estoque.` : ''}
        textoConfirmar="Excluir"
        carregando={salvando}
        onConfirmar={excluir}
        onFechar={() => setParaExcluir(null)}
      />
    </>
  )
}
