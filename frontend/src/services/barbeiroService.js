import api from './api'

/** Barbeiros: vitrine para o cliente, perfil profissional, painel e comissões. */
export const barbeiroService = {
  listar: () => api.get('/barbeiros').then((r) => r.data),
  listarTodos: () => api.get('/barbeiros/gerenciar').then((r) => r.data),
  buscar: (id) => api.get(`/barbeiros/${id}`).then((r) => r.data),
  meuPerfil: () => api.get('/barbeiros/eu').then((r) => r.data),
  atualizarMeuPerfil: (dados) => api.put('/barbeiros/eu', dados).then((r) => r.data),
  painel: (params) => api.get('/barbeiros/painel', { params }).then((r) => r.data),
  agenda: (params) => api.get('/barbeiros/agenda', { params }).then((r) => r.data),
  comissao: (params) => api.get('/barbeiros/comissao', { params }).then((r) => r.data),
  cadastrar: (dados) => api.post('/barbeiros', dados).then((r) => r.data),
  atualizar: (id, dados) => api.put(`/barbeiros/${id}`, dados).then((r) => r.data),
  alterarStatus: (id, ativo) =>
    api.patch(`/barbeiros/${id}/status`, null, { params: { ativo } }).then((r) => r.data),
}
