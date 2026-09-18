import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'
import { lerToken, lerUsuarioSalvo, limparSessao, salvarSessao } from '../services/api'

/**
 * Sessão do usuário. O token fica no localStorage e é reidratado no primeiro
 * render; em seguida `/auth/eu` confirma se ele ainda é válido.
 */
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => lerUsuarioSalvo())
  const [carregando, setCarregando] = useState(() => Boolean(lerToken()))

  useEffect(() => {
    const token = lerToken()
    if (!token) {
      setCarregando(false)
      return
    }
    let ativo = true
    authService
      .eu()
      .then((dados) => {
        if (!ativo) return
        setUsuario(dados)
        salvarSessao(token, dados)
      })
      .catch(() => {
        if (!ativo) return
        limparSessao()
        setUsuario(null)
      })
      .finally(() => ativo && setCarregando(false))
    return () => {
      ativo = false
    }
  }, [])

  const entrar = useCallback(async (credenciais) => {
    const resposta = await authService.login(credenciais)
    salvarSessao(resposta.token, resposta.usuario)
    setUsuario(resposta.usuario)
    return resposta.usuario
  }, [])

  const registrar = useCallback(async (dados) => {
    const resposta = await authService.registrar(dados)
    salvarSessao(resposta.token, resposta.usuario)
    setUsuario(resposta.usuario)
    return resposta.usuario
  }, [])

  const sair = useCallback(() => {
    limparSessao()
    setUsuario(null)
  }, [])

  /** Atualiza o usuário em memória após editar o perfil. */
  const atualizarUsuario = useCallback((dados) => {
    setUsuario(dados)
    const token = lerToken()
    if (token) salvarSessao(token, dados)
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      autenticado: Boolean(usuario),
      perfil: usuario?.tipoUsuario ?? null,
      entrar,
      registrar,
      sair,
      atualizarUsuario,
    }),
    [usuario, carregando, entrar, registrar, sair, atualizarUsuario],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
