import { useMemo, useState } from 'react'
import { barbeiroService } from '../../services/barbeiroService'
import { despesaService } from '../../services/despesaService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Indicador } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { AreaTexto, Campo, Entrada, Selecao } from '../../components/ui/Campo'
import { Confirmacao, Modal } from '../../components/ui/Modal'
import { Barra } from '../../components/ui/Barra'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { data, fimDoMes, hojeISO, inicioDoMes, moeda } from '../../utils/formato'

const FORM_VAZIO = {
  categoria: '',
  valor: '',
  data: hojeISO(),
  descricao: '',
  barbeiroId: '',
}

/** CRUD de despesas por período — alimenta o lado dos gastos na gestão financeira. */
export default function GestaoDespesas() {
  const toast = useToast()
  const [inicio, setInicio] = useState(inicioDoMes())
  const [fim, setFim] = useState(fimDoMes())

  const despesas = useCarregar(() => despesaService.listar({ inicio, fim }), [inicio, fim])
  const barbeiros = useCarregar(() => barbeiroService.listarTodos(), [])
  const categorias = useCarregar(() => despesaService.categorias(), [])

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [paraExcluir, setParaExcluir] = useState(null)

  const resumo = useMemo(() => {
    const lista = despesas.dados ?? []
    const total = lista.reduce((acc, d) => acc + Number(d.valor ?? 0), 0)
    const porCategoria = new Map()
    for (const d of lista) {
      porCategoria.set(d.categoria, (porCategoria.get(d.categoria) ?? 0) + Number(d.valor ?? 0))
    }
    const ranking = [...porCategoria.entries()].sort((a, b) => b[1] - a[1])
    return {
      total,
      quantidade: lista.length,
      media: lista.length ? total / lista.length : 0,
      ranking,
      maior: ranking[0]?.[1] ?? 0,
    }
  }, [despesas.dados])

  function abrirNova() {
    setEditando(null)
    setForm({ ...FORM_VAZIO, data: hojeISO() })
    setErros({})
    setModalAberto(true)
  }

  function abrirEdicao(despesa) {
    setEditando(despesa)
    setForm({
      categoria: despesa.categoria,
      valor: despesa.valor,
      data: String(despesa.data).slice(0, 10),
      descricao: despesa.descricao ?? '',
      barbeiroId: despesa.barbeiroId ? String(despesa.barbeiroId) : '',
    })
    setErros({})
    setModalAberto(true)
  }

  function validar() {
    const novos = {}
    if (!form.categoria.trim()) novos.categoria = 'Informe a categoria.'
    if (form.valor === '' || Number(form.valor) < 0) novos.valor = 'Informe um valor válido.'
    if (!form.data) novos.data = 'Informe a data.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!validar()) return

    const corpo = {
      categoria: form.categoria.trim(),
      valor: Number(form.valor),
      data: form.data,
      descricao: form.descricao.trim() || null,
      barbeiroId: form.barbeiroId ? Number(form.barbeiroId) : null,
    }

    setSalvando(true)
    try {
      if (editando) {
        await despesaService.editar(editando.id, corpo)
        toast.sucesso('Despesa atualizada.')
      } else {
        await despesaService.cadastrar(corpo)
        toast.sucesso('Despesa registrada.')
      }
      setModalAberto(false)
      despesas.recarregar()
      categorias.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar a despesa.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setSalvando(true)
    try {
      await despesaService.excluir(paraExcluir.id)
      toast.sucesso('Despesa excluída.')
      setParaExcluir(null)
      despesas.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível excluir.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Despesas"
        subtitulo="Todos os gastos que entram no cálculo do saldo do período."
        acao={
          <Botao variante="primario" onClick={abrirNova}>
            Nova despesa
          </Botao>
        }
      />

      <div className="filtros">
        <Campo rotulo="De" htmlFor="de">
          <Entrada id="de" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
        </Campo>
        <Campo rotulo="Até" htmlFor="ate">
          <Entrada id="ate" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
        </Campo>
        <Botao
          variante="contorno"
          onClick={() => {
            setInicio(inicioDoMes())
            setFim(fimDoMes())
          }}
        >
          Mês atual
        </Botao>
      </div>

      {despesas.carregando ? (
        <Carregando />
      ) : despesas.erro ? (
        <Erro mensagem={despesas.erro} onTentarNovamente={despesas.recarregar} />
      ) : (
        <div className="pilha">
          <div className="grade grade--3">
            <Indicador rotulo="Total no período" valor={moeda(resumo.total)} tom="erro" />
            <Indicador rotulo="Lançamentos" valor={resumo.quantidade} />
            <Indicador rotulo="Ticket médio" valor={moeda(resumo.media)} />
          </div>

          {resumo.ranking.length > 0 && (
            <Cartao titulo="Gastos por categoria">
              {resumo.ranking.map(([categoria, valor]) => (
                <Barra key={categoria} rotulo={categoria} valor={valor} maximo={resumo.maior} tom="gasto" />
              ))}
            </Cartao>
          )}

          <Cartao titulo={`Lançamentos (${resumo.quantidade})`}>
            {despesas.dados?.length ? (
              <div className="tabela-wrapper">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Categoria</th>
                      <th>Descrição</th>
                      <th>Barbeiro</th>
                      <th className="numerico">Valor</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.dados.map((despesa) => (
                      <tr key={despesa.id}>
                        <td>{data(despesa.data)}</td>
                        <td>{despesa.categoria}</td>
                        <td className="texto-suave">{despesa.descricao || '—'}</td>
                        <td className="texto-suave">{despesa.barbeiroNome || '—'}</td>
                        <td className="numerico">{moeda(despesa.valor)}</td>
                        <td>
                          <div className="item__acoes">
                            <Botao pequeno variante="contorno" onClick={() => abrirEdicao(despesa)}>
                              Editar
                            </Botao>
                            <Botao pequeno variante="perigo" onClick={() => setParaExcluir(despesa)}>
                              Excluir
                            </Botao>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Vazio
                icone="🧾"
                titulo="Nenhuma despesa no período"
                acao={
                  <Botao variante="primario" onClick={abrirNova}>
                    Registrar despesa
                  </Botao>
                }
              />
            )}
          </Cartao>
        </div>
      )}

      <Modal
        aberto={modalAberto}
        titulo={editando ? 'Editar despesa' : 'Nova despesa'}
        onFechar={() => setModalAberto(false)}
      >
        <form className="pilha" onSubmit={salvar}>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Categoria" erro={erros.categoria} htmlFor="d-cat">
              <Entrada
                id="d-cat"
                list="categorias-despesa"
                placeholder="Aluguel, Energia, Insumos..."
                erro={erros.categoria}
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
              <datalist id="categorias-despesa">
                {(categorias.dados ?? []).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Campo>
            <Campo rotulo="Valor (R$)" erro={erros.valor} htmlFor="d-valor">
              <Entrada
                id="d-valor"
                type="number"
                min="0"
                step="0.01"
                erro={erros.valor}
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
              />
            </Campo>
          </div>
          <div className="form-grade form-grade--2">
            <Campo rotulo="Data" erro={erros.data} htmlFor="d-data">
              <Entrada
                id="d-data"
                type="date"
                erro={erros.data}
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Barbeiro" dica="Opcional — para gastos ligados a um profissional." htmlFor="d-barb">
              <Selecao
                id="d-barb"
                value={form.barbeiroId}
                onChange={(e) => setForm({ ...form, barbeiroId: e.target.value })}
              >
                <option value="">Despesa da barbearia</option>
                {(barbeiros.dados ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome}
                  </option>
                ))}
              </Selecao>
            </Campo>
          </div>
          <Campo rotulo="Descrição" htmlFor="d-desc">
            <AreaTexto
              id="d-desc"
              placeholder="Detalhe o que foi pago"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
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
        aberto={Boolean(paraExcluir)}
        titulo="Excluir despesa"
        mensagem={
          paraExcluir
            ? `Excluir a despesa de ${moeda(paraExcluir.valor)} em ${data(paraExcluir.data)}?`
            : ''
        }
        textoConfirmar="Excluir"
        carregando={salvando}
        onConfirmar={excluir}
        onFechar={() => setParaExcluir(null)}
      />
    </>
  )
}
