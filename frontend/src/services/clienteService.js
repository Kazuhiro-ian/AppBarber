import api from './api'

/** Dados de cliente: home consolidada e listagens administrativas. */
export const clienteService = {
  home: () => api.get('/clientes/home').then((r) => r.data),
  listar: (params) => api.get('/clientes', { params }).then((r) => r.data),
  assinantes: () => api.get('/clientes/assinantes').then((r) => r.data),
  buscar: (id) => api.get(`/clientes/${id}`).then((r) => r.data),
}
