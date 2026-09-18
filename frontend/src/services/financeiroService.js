import api from './api'

/** Gestão financeira: saldo, relatório gerencial e comparativos. */
export const financeiroService = {
  resumo: (inicio, fim) => api.get('/financeiro/resumo', { params: { inicio, fim } }).then((r) => r.data),
  relatorio: (inicio, fim) =>
    api.get('/financeiro/relatorio', { params: { inicio, fim } }).then((r) => r.data),
  comparativo: (params) => api.get('/financeiro/comparativo', { params }).then((r) => r.data),
  dashboard: () => api.get('/financeiro/dashboard').then((r) => r.data),
}
