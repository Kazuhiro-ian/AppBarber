import { useMemo, useState } from 'react'
import { clienteService } from '../../services/clienteService'
import { useCarregar } from '../../hooks/useCarregar'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Entrada } from '../../components/ui/Campo'
import { Avatar } from '../../components/ui/Avatar'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { data, moeda, rotuloAssinatura } from '../../utils/formato'

/** Base de clientes com a situação da assinatura de cada um. */
export default function Clientes() {
  const [busca, setBusca] = useState('')
  const { dados, carregando, erro, recarregar } = useCarregar(() => clienteService.listar(), [])

  const filtrados = useMemo(() => {
    const lista = dados ?? []
    if (!busca.trim()) return lista
    const termo = busca.trim().toLowerCase()
    return lista.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.email.toLowerCase().includes(termo) ||
        (c.telefone ?? '').includes(termo),
    )
  }, [dados, busca])

  const totais = useMemo(() => {
    const lista = dados ?? []
    const assinantes = lista.filter((c) => c.assinatura?.vigente)
    return {
      total: lista.length,
      assinantes: assinantes.length,
      receitaRecorrente: assinantes.reduce((acc, c) => acc + Number(c.assinatura?.preco ?? 0), 0),
    }
  }, [dados])

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  return (
    <>
      <CabecalhoPagina titulo="Clientes" subtitulo="Quem já criou conta e quem tem assinatura ativa." />

      <div className="pilha">
        <div className="grade grade--3">
          <Indicador rotulo="Clientes cadastrados" valor={totais.total} />
          <Indicador rotulo="Com assinatura vigente" valor={totais.assinantes} tom="sucesso" />
          <Indicador
            rotulo="Receita recorrente"
            valor={moeda(totais.receitaRecorrente)}
            apoio="Soma dos planos vigentes"
            tom="marca"
          />
        </div>

        <Cartao
          titulo={`Lista de clientes (${filtrados.length})`}
          acao={
            <Entrada
              placeholder="Buscar por nome, e-mail ou telefone"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ maxWidth: 280 }}
            />
          }
        >
          {filtrados.length ? (
            <div className="lista">
              {filtrados.map((cliente) => {
                const assinatura = cliente.assinatura
                const status = assinatura ? rotuloAssinatura(assinatura.status) : null
                return (
                  <article className="item" key={cliente.id}>
                    <div className="linha" style={{ gap: 12, flex: 1, minWidth: 0 }}>
                      <Avatar nome={cliente.nome} foto={cliente.fotoPerfil} />
                      <div className="item__principal">
                        <span className="item__titulo">{cliente.nome}</span>
                        <span className="item__meta">
                          <span>✉️ {cliente.email}</span>
                          {cliente.telefone && <span>📞 {cliente.telefone}</span>}
                        </span>
                        {assinatura && (
                          <span className="item__meta">
                            <span>
                              ⭐ {assinatura.nome} · {moeda(assinatura.preco)} · renova em{' '}
                              {data(assinatura.dataRenovacao)}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="item__acoes">
                      {status ? (
                        <Etiqueta tom={status.classe.replace('badge--', '')}>{status.texto}</Etiqueta>
                      ) : (
                        <Etiqueta>Sem assinatura</Etiqueta>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <Vazio icone="🧑‍🤝‍🧑" titulo="Nenhum cliente encontrado" />
          )}
        </Cartao>
      </div>
    </>
  )
}
