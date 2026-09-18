import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'
import { rotaInicial } from '../../utils/navegacao'

/** Contas da carga inicial (V2__dados_iniciais.sql), para facilitar os testes. */
const CONTAS_DEMO = [
  { rotulo: 'Cliente', email: 'joao@email.com', senha: 'cliente123' },
  { rotulo: 'Barbeiro', email: 'carlos@appbarber.com', senha: 'barbeiro123' },
  { rotulo: 'Admin', email: 'admin@appbarber.com', senha: 'admin123' },
]

export default function Login() {
  const { entrar } = useAuth()
  const navegar = useNavigate()
  const local = useLocation()
  const [params] = useSearchParams()

  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState(params.get('expirada') ? 'Sua sessão expirou. Entre novamente.' : '')
  const [enviando, setEnviando] = useState(false)

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')

    if (!form.email.trim() || !form.senha) {
      setErro('Informe e-mail e senha.')
      return
    }

    setEnviando(true)
    try {
      const usuario = await entrar({ email: form.email.trim(), senha: form.senha })
      const destino = local.state?.de || rotaInicial(usuario.tipoUsuario)
      navegar(destino, { replace: true })
    } catch (e) {
      setErro(e.mensagem || 'Não foi possível entrar.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="auth">
      <div className="auth__cartao">
        <div className="auth__marca">
          <span className="auth__logo">AB</span>
          <div>
            <h1>AppBarber</h1>
            <p className="texto-suave">Entre para gerenciar seus horários</p>
          </div>
        </div>

        <form className="pilha" onSubmit={enviar} noValidate>
          {erro && <div className="aviso aviso--erro">{erro}</div>}

          <Campo rotulo="E-mail" htmlFor="email">
            <Entrada
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={form.email}
              onChange={(e) => alterar('email', e.target.value)}
            />
          </Campo>

          <Campo rotulo="Senha" htmlFor="senha">
            <Entrada
              id="senha"
              type="password"
              autoComplete="current-password"
              placeholder="Sua senha"
              value={form.senha}
              onChange={(e) => alterar('senha', e.target.value)}
            />
          </Campo>

          <Botao tipo="submit" variante="primario" bloco carregando={enviando}>
            Entrar
          </Botao>
        </form>

        <p className="auth__rodape">
          Ainda não tem conta? <Link to="/criar-conta">Criar conta</Link>
        </p>

        <div className="auth__demo">
          <strong>Contas de demonstração:</strong>
          <div className="linha" style={{ gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            {CONTAS_DEMO.map((conta) => (
              <button
                key={conta.email}
                type="button"
                onClick={() => setForm({ email: conta.email, senha: conta.senha })}
              >
                {conta.rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
