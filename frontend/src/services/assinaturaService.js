import api from './api'

/** Catálogo de planos e assinatura do cliente autenticado. */
export const assinaturaService = {
  planos: () => api.get('/planos').then((r) => r.data),
  planosGestao: () => api.get('/planos/gerenciar').then((r) => r.data),
  criarPlano: (dados) => api.post('/planos', dados).then((r) => r.data),
  editarPlano: (id, dados) => api.put(`/planos/${id}`, dados).then((r) => r.data),
  removerPlano: (id) => api.delete(`/planos/${id}`).then((r) => r.data),

  // 204 (sem conteúdo) significa "cliente ainda não assinou nenhum plano".
  minha: () => api.get('/assinaturas/minha').then((r) => (r.status === 204 ? null : r.data)),
  assinar: (planoId) => api.post(`/assinaturas/planos/${planoId}`).then((r) => r.data),
  renovar: () => api.patch('/assinaturas/minha/renovar').then((r) => r.data),
  cancelar: () => api.delete('/assinaturas/minha').then((r) => r.data),
}
