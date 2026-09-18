import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Carregando } from './ui/Estados'
import { rotaInicial } from '../utils/navegacao'

/**
 * Protege rotas por autenticação e, opcionalmente, por perfil.
 * O backend valida de novo em cada requisição: isto aqui é só a experiência
 * de navegação, nunca a fonte de verdade da autorização.
 */
export function RotaProtegida({ perfis, children }) {
  const { autenticado, carregando, perfil } = useAuth()
  const local = useLocation()

  if (carregando) {
    return <Carregando texto="Verificando sessão..." />
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ de: local.pathname }} />
  }

  if (perfis && !perfis.includes(perfil)) {
    return <Navigate to={rotaInicial(perfil)} replace />
  }

  return children
}

/** Usada nas telas de login/registro: quem já entrou vai direto para a home do perfil. */
export function RotaPublica({ children }) {
  const { autenticado, carregando, perfil } = useAuth()

  if (carregando) {
    return <Carregando texto="Verificando sessão..." />
  }
  if (autenticado) {
    return <Navigate to={rotaInicial(perfil)} replace />
  }
  return children
}
