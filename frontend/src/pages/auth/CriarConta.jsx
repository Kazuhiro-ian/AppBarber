import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Botao } from '../../components/ui/Botao'
import { Campo, Entrada } from '../../components/ui/Campo'

/** Cadastro de cliente. Contas de barbeiro e admin são criadas pelo administrador. */
export default function CriarConta() {
  const { registrar } = useAuth()
  const navegar = useNavigate()

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    confirmacao: '',
  })
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => ({ ...atuais, [campo]: undefined }))
  }

  function validar() {
    const novos = {}
    if (!form.nome.trim()) novos.nome = 'Informe seu nome.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) novos.email = 'E-mail inválido.'
    if (form.senha.length < 6) novos.senha = 'A senha precisa ter ao menos 6 caracteres.'
    if (form.senha !== form.confirmacao) novos.confirmacao = 'As senhas não conferem.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function enviar(evento) {
    evento.preventDefault()
    setErroGeral('')
    if (!validar()) return

    setEnviando(true)
    try {
      await registrar({
        nome: form.nome.trim(),
        email: form.email.trim(),
        senha: form.senha,
        telefone: form.telefone.trim() || null,
      })
      navegar('/', { replace: true })
    } catch (e) {
      setErroGeral(e.mensagem || 'Não foi possível criar a conta.')
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
            <h1>Criar conta</h1>
            <p className="texto-suave">Leva menos de um minuto</p>
          </div>
        </div>

        <form className="pilha" onSubmit={enviar} noValidate>
          {erroGeral && <div className="aviso aviso--erro">{erroGeral}</div>}

          <Campo rotulo="Nome completo" erro={erros.nome} htmlFor="nome">
            <Entrada
              id="nome"
              autoComplete="name"
              placeholder="Como quer ser chamado"
              value={form.nome}
              erro={erros.nome}
              onChange={(e) => alterar('nome', e.target.value)}
            />
          </Campo>

          <Campo rotulo="E-mail" erro={erros.email} htmlFor="email">
            <Entrada
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={form.email}
              erro={erros.email}
              onChange={(e) => alterar('email', e.target.value)}
            />
          </Campo>

          <Campo rotulo="Telefone" dica="Opcional — usamos para avisar sobre o atendimento" htmlFor="telefone">
            <Entrada
              id="telefone"
              autoComplete="tel"
              placeholder="(11) 90000-0000"
              value={form.telefone}
              onChange={(e) => alterar('telefone', e.target.value)}
            />
          </Campo>

          <div className="form-grade form-grade--2">
            <Campo rotulo="Senha" erro={erros.senha} htmlFor="senha">
              <Entrada
                id="senha"
                type="password"
                autoComplete="new-password"
                value={form.senha}
                erro={erros.senha}
                onChange={(e) => alterar('senha', e.target.value)}
              />
            </Campo>

            <Campo rotulo="Confirmar senha" erro={erros.confirmacao} htmlFor="confirmacao">
              <Entrada
                id="confirmacao"
                type="password"
                autoComplete="new-password"
                value={form.confirmacao}
                erro={erros.confirmacao}
                onChange={(e) => alterar('confirmacao', e.target.value)}
              />
            </Campo>
          </div>

          <Botao tipo="submit" variante="primario" bloco carregando={enviando}>
            Criar conta
          </Botao>
        </form>

        <p className="auth__rodape">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
