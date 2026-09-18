import api from './api'

/** Catálogo de serviços da barbearia. */
export const servicoService = {
  listar: (params) => api.get('/servicos', { params }).then((r) => r.data),
  buscar: (id) => api.get(`/servicos/${id}`).then((r) => r.data),
  cadastrar: (dados) => api.post('/servicos', dados).then((r) => r.data),
  editar: (id, dados) => api.put(`/servicos/${id}`, dados).then((r) => r.data),
  inativar: (id) => api.delete(`/servicos/${id}`).then((r) => r.data),
  reativar: (id) => api.patch(`/servicos/${id}/reativar`).then((r) => r.data),
}
