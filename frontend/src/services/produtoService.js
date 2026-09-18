import api from './api'

/** Estoque de produtos e movimentações. */
export const produtoService = {
  listar: (params) => api.get('/produtos', { params }).then((r) => r.data),
  estoqueBaixo: () => api.get('/produtos/estoque-baixo').then((r) => r.data),
  buscar: (id) => api.get(`/produtos/${id}`).then((r) => r.data),
  cadastrar: (dados) => api.post('/produtos', dados).then((r) => r.data),
  editar: (id, dados) => api.put(`/produtos/${id}`, dados).then((r) => r.data),
  excluir: (id) => api.delete(`/produtos/${id}`).then((r) => r.data),
  darBaixa: (id, quantidade) =>
    api.patch(`/produtos/${id}/baixa`, { quantidade }).then((r) => r.data),
  repor: (id, quantidade) =>
    api.patch(`/produtos/${id}/entrada`, { quantidade }).then((r) => r.data),
}
