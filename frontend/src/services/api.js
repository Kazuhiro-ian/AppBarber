import axios from 'axios'

/**
 * Cliente HTTP único da aplicação.
 *
 * - Injeta o JWT salvo no localStorage em toda requisição.
 * - Normaliza o corpo de erro do backend ({@code ErroResponse}) em uma
 *   mensagem pronta para exibir na tela.
 * - Em 401, limpa a sessão e devolve o usuário ao login.
 */

export const CHAVE_TOKEN = 'appbarber.token'
export const CHAVE_USUARIO = 'appbarber.usuario'

const api = axios.create({
  // Sem VITE_API_URL, usa /api — que o proxy do Vite encaminha para o backend em dev.
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

export function lerToken() {
  try {
    return localStorage.getItem(CHAVE_TOKEN)
  } catch {
    return null
  }
}

export function salvarSessao(token, usuario) {
  try {
    localStorage.setItem(CHAVE_TOKEN, token)
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario))
  } catch {
    /* modo privado/armazenamento bloqueado: a sessão vive só em memória */
  }
}

export function lerUsuarioSalvo() {
  try {
    const bruto = localStorage.getItem(CHAVE_USUARIO)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

export function limparSessao() {
  try {
    localStorage.removeItem(CHAVE_TOKEN)
    localStorage.removeItem(CHAVE_USUARIO)
  } catch {
    /* nada a fazer */
  }
}

api.interceptors.request.use((config) => {
  const token = lerToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const status = erro.response?.status
    const corpo = erro.response?.data

    // 401 fora da própria tela de login significa sessão expirada.
    const ehLogin = erro.config?.url?.includes('/auth/login')
    if (status === 401 && !ehLogin) {
      limparSessao()
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login?expirada=1')
      }
    }

    return Promise.reject(
      Object.assign(erro, {
        mensagem: extrairMensagem(corpo, status),
        campos: corpo?.campos || null,
      }),
    )
  },
)

/** Converte o ErroResponse do backend na frase que vai para a tela. */
function extrairMensagem(corpo, status) {
  if (corpo?.campos) {
    const primeiro = Object.values(corpo.campos)[0]
    if (primeiro) return primeiro
  }
  if (corpo?.mensagem) return corpo.mensagem
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status >= 500) return 'Erro no servidor. Tente novamente em instantes.'
  if (status === undefined) return 'Não foi possível falar com o servidor. Verifique se a API está no ar.'
  return 'Não foi possível concluir a operação.'
}

export default api
