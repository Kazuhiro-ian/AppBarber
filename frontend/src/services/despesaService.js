import api from './api'

/** Despesas da barbearia. */
export const despesaService = {
  listar: (params) => api.get('/despesas', { params }).then((r) => r.data),
  categorias: () => api.get('/despesas/categorias').then((r) => r.data),
  buscar: (id) => api.get(`/despesas/${id}`).then((r) => r.data),
  cadastrar: (dados) => api.post('/despesas', dados).then((r) => r.data),
  editar: (id, dados) => api.put(`/despesas/${id}`, dados).then((r) => r.data),
  excluir: (id) => api.delete(`/despesas/${id}`).then((r) => r.data),
}
