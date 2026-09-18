import { useState } from 'react'
import { authService } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { CabecalhoPagina } from '../components/ui/CabecalhoPagina'
import { Cartao } from '../components/ui/Cartao'
import { Botao } from '../components/ui/Botao'
import { Campo, Entrada } from '../components/ui/Campo'
import { Avatar } from '../components/ui/Avatar'
import { rotuloPerfil } from '../utils/navegacao'

/** Perfil da conta — vale para os três perfis de usuário. */
export default function Perfil() {
  const { usuario, perfil, atualizarUsuario, sair } = useAuth()
  const toast = useToast()

  const [dados, setDados] = useState({
    nome: usuario?.nome ?? '',
    telefone: usuario?.telefone ?? '',
    fotoPerfil: usuario?.fotoPerfil ?? '',
  })
  const [senhas, setSenhas] = useState({ senhaAtual: '', novaSenha: '', confirmacao: '' })
  const [errosSenha, setErrosSenha] = useState({})
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  async function salvarPerfil(evento) {
    evento.preventDefault()
    if (!dados.nome.trim()) {
      toast.erro('O nome não pode ficar em branco.')
      return
    }
    setSalvandoPerfil(true)
    try {
      const atualizado = await authService.atualizarPerfil({
        nome: dados.nome.trim(),
        telefone: dados.telefone.trim(),
        fotoPerfil: dados.fotoPerfil.trim(),
      })
      atualizarUsuario(atualizado)
      toast.sucesso('Perfil atualizado.')
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível salvar o perfil.')
    } finally {
      setSalvandoPerfil(false)
    }
  }

  async function salvarSenha(evento) {
    evento.preventDefault()
    const erros = {}
    if (!senhas.senhaAtual) erros.senhaAtual = 'Informe a senha atual.'
    if (senhas.novaSenha.length < 6) erros.novaSenha = 'A nova senha precisa ter ao menos 6 caracteres.'
    if (senhas.novaSenha !== senhas.confirmacao) erros.confirmacao = 'As senhas não conferem.'
    setErrosSenha(erros)
    if (Object.keys(erros).length) return

    setSalvandoSenha(true)
    try {
      await authService.alterarSenha({
        senhaAtual: senhas.senhaAtual,
        novaSenha: senhas.novaSenha,
      })
      setSenhas({ senhaAtual: '', novaSenha: '', confirmacao: '' })
      toast.sucesso('Senha alterada com sucesso.')
    } catch (e) {
      toast.erro(e.mensagem || 'Não foi possível alterar a senha.')
    } finally {
      setSalvandoSenha(false)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Meu perfil" subtitulo="Seus dados de acesso e contato." />

      <div className="pilha">
        <Cartao>
          <div className="linha" style={{ gap: 16 }}>
            <Avatar nome={usuario?.nome} foto={usuario?.fotoPerfil} grande />
            <div className="pilha" style={{ gap: 2 }}>
              <strong style={{ fontSize: '1.1rem' }}>{usuario?.nome}</strong>
              <span className="texto-suave">{usuario?.email}</span>
              <span className="texto-fraco">{rotuloPerfil(perfil)}</span>
            </div>
          </div>
        </Cartao>

        <Cartao titulo="Dados pessoais">
          <form className="pilha" onSubmit={salvarPerfil}>
            <div className="form-grade form-grade--2">
              <Campo rotulo="Nome" htmlFor="nome">
                <Entrada
                  id="nome"
                  value={dados.nome}
                  onChange={(e) => setDados({ ...dados, nome: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Telefone" htmlFor="telefone">
                <Entrada
                  id="telefone"
                  placeholder="(11) 90000-0000"
                  value={dados.telefone}
                  onChange={(e) => setDados({ ...dados, telefone: e.target.value })}
                />
              </Campo>
            </div>
            <Campo rotulo="Foto de perfil (URL)" dica="Cole o endereço de uma imagem já hospedada." htmlFor="foto">
              <Entrada
                id="foto"
                placeholder="https://..."
                value={dados.fotoPerfil}
                onChange={(e) => setDados({ ...dados, fotoPerfil: e.target.value })}
              />
            </Campo>
            <Campo rotulo="E-mail" dica="O e-mail de acesso não pode ser alterado por aqui.">
              <Entrada value={usuario?.email ?? ''} disabled />
            </Campo>
            <div className="form-acoes">
              <Botao tipo="submit" variante="primario" carregando={salvandoPerfil}>
                Salvar alterações
              </Botao>
            </div>
          </form>
        </Cartao>

        <Cartao titulo="Alterar senha">
          <form className="pilha" onSubmit={salvarSenha}>
            <Campo rotulo="Senha atual" erro={errosSenha.senhaAtual} htmlFor="senha-atual">
              <Entrada
                id="senha-atual"
                type="password"
                autoComplete="current-password"
                erro={errosSenha.senhaAtual}
                value={senhas.senhaAtual}
                onChange={(e) => setSenhas({ ...senhas, senhaAtual: e.target.value })}
              />
            </Campo>
            <div className="form-grade form-grade--2">
              <Campo rotulo="Nova senha" erro={errosSenha.novaSenha} htmlFor="nova-senha">
                <Entrada
                  id="nova-senha"
                  type="password"
                  autoComplete="new-password"
                  erro={errosSenha.novaSenha}
                  value={senhas.novaSenha}
                  onChange={(e) => setSenhas({ ...senhas, novaSenha: e.target.value })}
                />
              </Campo>
              <Campo rotulo="Confirmar nova senha" erro={errosSenha.confirmacao} htmlFor="confirmacao">
                <Entrada
                  id="confirmacao"
                  type="password"
                  autoComplete="new-password"
                  erro={errosSenha.confirmacao}
                  value={senhas.confirmacao}
                  onChange={(e) => setSenhas({ ...senhas, confirmacao: e.target.value })}
                />
              </Campo>
            </div>
            <div className="form-acoes">
              <Botao tipo="submit" variante="primario" carregando={salvandoSenha}>
                Alterar senha
              </Botao>
            </div>
          </form>
        </Cartao>

        <Cartao titulo="Sessão">
          <div className="linha-entre">
            <span className="texto-suave">Encerrar a sessão neste dispositivo.</span>
            <Botao variante="perigo" onClick={sair}>
              Sair da conta
            </Botao>
          </div>
        </Cartao>
      </div>
    </>
  )
}
