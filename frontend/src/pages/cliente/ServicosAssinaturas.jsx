import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { assinaturaService } from '../../services/assinaturaService'
import { servicoService } from '../../services/servicoService'
import { useCarregar } from '../../hooks/useCarregar'
import { useToast } from '../../hooks/useToast'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta } from '../../components/ui/Cartao'
import { Botao } from '../../components/ui/Botao'
import { Confirmacao } from '../../components/ui/Modal'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import {
  data,
  duracao,
  moeda,
  rotuloAssinatura,
  rotuloPeriodicidade,
} from '../../utils/formato'

/** Vitrine de serviços + planos de assinatura, com contratar/renovar/cancelar. */
export default function ServicosAssinaturas() {
  const toast = useToast()
  const servicos = useCarregar(() => servicoService.listar({ apenasAtivos: true }), [])
  const planos = useCarregar(() => assinaturaService.planos(), [])
  const minha = useCarregar(() => assinaturaService.minha(), [])

  const [processando, setProcessando] = useState(false)
  const [confirmarCancelamento, setConfirmarCancelamento] = useState(false)

  const porCategoria = useMemo(() => agrupar(servicos.dados ?? []), [servicos.dados])
  const assinatura = minha.dados
  const temAssinaturaVigente = Boolean(assinatura?.vigente)

  async function assinar(plano) {
    setProcessando(true)
    try {
      await assinaturaService.assinar(plano.id)
      toast.sucesso(`Plano ${plano.nome} contratado!`)
      minha.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível contratar o plano.')
    } finally {
      setProcessando(false)
    }
  }

  async function renovar() {
    setProcessando(true)
    try {
      await assinaturaService.renovar()
      toast.sucesso('Assinatura renovada.')
      minha.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível renovar.')
    } finally {
      setProcessando(false)
    }
  }

  async function cancelar() {
    setProcessando(true)
    try {
      await assinaturaService.cancelar()
      toast.sucesso('Assinatura cancelada.')
      setConfirmarCancelamento(false)
      minha.recarregar()
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível cancelar.')
    } finally {
      setProcessando(false)
    }
  }

  if (servicos.carregando || planos.carregando || minha.carregando) return <Carregando />
  if (servicos.erro) return <Erro mensagem={servicos.erro} onTentarNovamente={servicos.recarregar} />

  return (
    <>
      <CabecalhoPagina
        titulo="Serviços e assinaturas"
        subtitulo="Conheça o que oferecemos e economize com um plano."
        acao={
          <Link className="btn btn--primario" to="/agendar">
            Agendar horário
          </Link>
        }
      />

      <div className="pilha">
        {assinatura && (
          <Cartao
            destaque
            titulo="Sua assinatura"
            acao={
              <Etiqueta tom={rotuloAssinatura(assinatura.status).classe.replace('badge--', '')}>
                {rotuloAssinatura(assinatura.status).texto}
              </Etiqueta>
            }
          >
            <div className="linha-entre">
              <div className="pilha" style={{ gap: 6 }}>
                <strong style={{ fontSize: '1.1rem' }}>{assinatura.nome}</strong>
                <span className="texto-suave">
                  {moeda(assinatura.preco)} {rotuloPeriodicidade(assinatura.periodicidade)}
                </span>
                <span className="texto-suave">
                  Início em {data(assinatura.dataInicio)} · renovação em{' '}
                  {data(assinatura.dataRenovacao)}
                  {assinatura.vigente && assinatura.diasParaRenovacao >= 0 && (
                    <> ({assinatura.diasParaRenovacao} dias)</>
                  )}
                </span>
                {assinatura.beneficios?.length > 0 && (
                  <ul className="texto-suave" style={{ paddingLeft: 18, margin: 0 }}>
                    {assinatura.beneficios.map((beneficio) => (
                      <li key={beneficio}>{beneficio}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="item__acoes">
                {assinatura.status !== 'CANCELADA' && (
                  <>
                    <Botao variante="contorno" onClick={renovar} carregando={processando}>
                      Renovar
                    </Botao>
                    <Botao variante="perigo" onClick={() => setConfirmarCancelamento(true)}>
                      Cancelar
                    </Botao>
                  </>
                )}
              </div>
            </div>
          </Cartao>
        )}

        <Cartao titulo="Planos de assinatura">
          {planos.erro ? (
            <Erro mensagem={planos.erro} onTentarNovamente={planos.recarregar} />
          ) : planos.dados?.length ? (
            <div className="grade grade--3">
              {planos.dados.map((plano) => (
                <div className="card" key={plano.id}>
                  <div className="pilha" style={{ gap: 10 }}>
                    <div>
                      <strong style={{ fontSize: '1.05rem' }}>{plano.nome}</strong>
                      <div className="opcao__preco" style={{ fontSize: '1.3rem', marginTop: 4 }}>
                        {moeda(plano.preco)}
                        <span className="texto-fraco"> {rotuloPeriodicidade(plano.periodicidade)}</span>
                      </div>
                    </div>
                    <ul className="texto-suave" style={{ paddingLeft: 18, margin: 0, fontSize: '0.88rem' }}>
                      {plano.beneficios.map((beneficio) => (
                        <li key={beneficio}>{beneficio}</li>
                      ))}
                    </ul>
                    <Botao
                      variante="primario"
                      bloco
                      disabled={temAssinaturaVigente}
                      carregando={processando}
                      onClick={() => assinar(plano)}
                    >
                      {temAssinaturaVigente ? 'Você já tem um plano' : 'Assinar'}
                    </Botao>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Vazio icone="⭐" titulo="Nenhum plano disponível no momento" />
          )}
        </Cartao>

        <Cartao titulo="Nossos serviços">
          {porCategoria.length ? (
            <div className="pilha">
              {porCategoria.map(([categoria, itens]) => (
                <div key={categoria}>
                  <div className="sidebar__titulo" style={{ padding: 0, marginBottom: 8 }}>
                    {categoria}
                  </div>
                  <div className="grade grade--auto">
                    {itens.map((servico) => (
                      <div className="opcao" key={servico.id}>
                        <span className="opcao__info">
                          <span className="opcao__nome">{servico.nome}</span>
                          <span className="opcao__detalhe">{duracao(servico.duracaoMinutos)}</span>
                        </span>
                        <span className="opcao__preco">{moeda(servico.preco)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Vazio icone="💈" titulo="Nenhum serviço cadastrado" />
          )}
        </Cartao>
      </div>

      <Confirmacao
        aberto={confirmarCancelamento}
        titulo="Cancelar assinatura"
        mensagem="Você perde os benefícios do plano imediatamente. Deseja continuar?"
        textoConfirmar="Cancelar assinatura"
        carregando={processando}
        onConfirmar={cancelar}
        onFechar={() => setConfirmarCancelamento(false)}
      />
    </>
  )
}

function agrupar(servicos) {
  const mapa = new Map()
  for (const servico of servicos) {
    const chave = servico.categoria || 'Outros'
    if (!mapa.has(chave)) mapa.set(chave, [])
    mapa.get(chave).push(servico)
  }
  return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
}
