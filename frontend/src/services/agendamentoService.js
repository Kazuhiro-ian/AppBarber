import api from './api'

/** Agendamentos: disponibilidade, criação e mudanças de status. */
export const agendamentoService = {
  disponibilidade: (params) =>
    api.get('/agendamentos/disponibilidade', { params }).then((r) => r.data),
  meus: (params) => api.get('/agendamentos/meus', { params }).then((r) => r.data),
  meusProximos: (params) => api.get('/agendamentos/meus/proximos', { params }).then((r) => r.data),
  agendaBarbeiro: (params) => api.get('/agendamentos/agenda', { params }).then((r) => r.data),
  agendaDoDia: (params) => api.get('/agendamentos/dia', { params }).then((r) => r.data),
  buscar: (id) => api.get(`/agendamentos/${id}`).then((r) => r.data),
  agendar: (dados) => api.post('/agendamentos', dados).then((r) => r.data),
  remarcar: (id, dados) => api.put(`/agendamentos/${id}/remarcar`, dados).then((r) => r.data),
  cancelar: (id) => api.patch(`/agendamentos/${id}/cancelar`).then((r) => r.data),
  concluir: (id) => api.patch(`/agendamentos/${id}/concluir`).then((r) => r.data),
}
