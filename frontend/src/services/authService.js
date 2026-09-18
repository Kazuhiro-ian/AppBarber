import api from './api'

/** Autenticação e dados da conta do usuário logado. */
export const authService = {
  registrar: (dados) => api.post('/auth/registrar', dados).then((r) => r.data),
  login: (dados) => api.post('/auth/login', dados).then((r) => r.data),
  eu: () => api.get('/auth/eu').then((r) => r.data),
  atualizarPerfil: (dados) => api.put('/auth/perfil', dados).then((r) => r.data),
  alterarSenha: (dados) => api.patch('/auth/senha', dados).then((r) => r.data),
}
