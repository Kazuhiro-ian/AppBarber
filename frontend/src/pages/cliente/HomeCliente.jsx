import { Link } from 'react-router-dom'
import { clienteService } from '../../services/clienteService'
import { useCarregar } from '../../hooks/useCarregar'
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina'
import { Cartao, Etiqueta, Indicador } from '../../components/ui/Cartao'
import { Carregando, Erro, Vazio } from '../../components/ui/Estados'
import { data, dataPorExtenso, ehHoje, hora, moeda, rotuloAssinatura } from '../../utils/formato'

/** Tela inicial do cliente: próximo horário, atalhos, histórico resumido e assinatura. */
export default function HomeCliente() {
  const { dados, carregando, erro, recarregar } = useCarregar(() => clienteService.home(), [])

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro} onTentarNovamente={recarregar} />

  const proximo = dados?.proximoAgendamento
  const outros = (dados?.proximosAgendamentos ?? []).slice(1)

  return (
    <>
      <CabecalhoPagina
        titulo={`Olá, ${primeiroNome(dados?.nome)}!`}
        subtitulo="Seu próximo corte começa aqui."
        acao={
          <Link className="btn btn--primario" to="/agendar">
            Agendar horário
          </Link>
        }
      />

      <div className="pilha">
        {proximo ? (
          <Cartao destaque titulo="Próximo atendimento">
            <div className="linha-entre">
              <div className="pilha" style={{ gap: 6 }}>
                <strong style={{ fontSize: '1.15rem' }}>{proximo.servicoNome}</strong>
                <span className="texto-suave">com {proximo.barbeiroNome}</span>
                <span className="texto-suave">
                  {ehHoje(proximo.data) ? 'Hoje' : dataPorExtenso(proximo.data)} às{' '}
                  {hora(proximo.horario)} · {moeda(proximo.valor)}
                </span>
              </div>
              <Link className="btn btn--contorno" to="/meus-agendamentos">
                Gerenciar
              </Link>
            </div>
          </Cartao>
        ) : (
          <Cartao>
            <Vazio
              icone="✂️"
              titulo="Você não tem horários marcados"
              descricao="Escolha um serviço e garanta seu lugar na cadeira."
              acao={
                <Link className="btn btn--primario" to="/agendar">
                  Agendar agora
                </Link>
              }
            />
          </Cartao>
        )}

        <div className="grade grade--3">
          <Indicador
            rotulo="Atendimentos"
            valor={dados?.totalAtendimentos ?? 0}
            apoio="Concluídos até hoje"
          />
          <Indicador
            rotulo="Total investido"
            valor={moeda(dados?.totalGasto)}
            apoio="Em serviços concluídos"
            tom="marca"
          />
          <Indicador
            rotulo="Assinatura"
            valor={dados?.assinatura?.nome ?? 'Sem plano'}
            apoio={
              dados?.assinatura
                ? `Renova em ${data(dados.assinatura.dataRenovacao)}`
                : 'Confira os planos disponíveis'
            }
          />
        </div>

        {outros.length > 0 && (
          <Cartao
            titulo="Outros horários marcados"
            acao={
              <Link className="btn btn--texto btn--pequeno" to="/meus-agendamentos">
                Ver todos
              </Link>
            }
          >
            <div className="lista">
              {outros.map((agendamento) => (
                <div className="item" key={agendamento.id}>
                  <div className="item__principal">
                    <span className="item__titulo">{agendamento.servicoNome}</span>
                    <span className="item__meta">
                      <span>{data(agendamento.data)}</span>
                      <span>{hora(agendamento.horario)}</span>
                      <span>{agendamento.barbeiroNome}</span>
                    </span>
                  </div>
                  <Etiqueta tom="info">{moeda(agendamento.valor)}</Etiqueta>
                </div>
              ))}
            </div>
          </Cartao>
        )}

        {dados?.assinatura && (
          <Cartao
            titulo="Sua assinatura"
            acao={
              <Link className="btn btn--texto btn--pequeno" to="/servicos">
                Gerenciar
              </Link>
            }
          >
            <div className="linha-entre">
              <div className="pilha" style={{ gap: 4 }}>
                <strong>{dados.assinatura.nome}</strong>
                <span className="texto-suave">
                  {moeda(dados.assinatura.preco)} · próxima renovação em{' '}
                  {data(dados.assinatura.dataRenovacao)}
                </span>
              </div>
              <Etiqueta tom={rotuloAssinatura(dados.assinatura.status).classe.replace('badge--', '')}>
                {rotuloAssinatura(dados.assinatura.status).texto}
              </Etiqueta>
            </div>
          </Cartao>
        )}
      </div>
    </>
  )
}

function primeiroNome(nome) {
  return nome ? nome.trim().split(/\s+/)[0] : 'tudo bem'
}
