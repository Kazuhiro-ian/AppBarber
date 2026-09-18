/** Formatações de exibição usadas em todas as telas (pt-BR). */

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const DATA_CURTA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const DATA_LONGA = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
})

export function moeda(valor) {
  const numero = Number(valor ?? 0)
  return MOEDA.format(Number.isFinite(numero) ? numero : 0)
}

/** "2026-09-17" -> "17/09/2026" (sem conversão de fuso). */
export function data(iso) {
  if (!iso) return '—'
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function dataCurta(iso) {
  if (!iso) return '—'
  return DATA_CURTA.format(paraDate(iso))
}

/** "17 de setembro, quarta-feira" — usado nos cabeçalhos de agenda. */
export function dataPorExtenso(iso) {
  if (!iso) return '—'
  const texto = DATA_LONGA.format(paraDate(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "14:30:00" -> "14:30". */
export function hora(valor) {
  if (!valor) return '—'
  return String(valor).slice(0, 5)
}

/** "2026-09-17T10:15:00" -> "17/09/2026 às 10:15". */
export function dataHora(iso) {
  if (!iso) return '—'
  const [dataParte, horaParte = ''] = String(iso).split('T')
  return `${data(dataParte)} às ${hora(horaParte)}`
}

/** Data de hoje no formato aceito por <input type="date">. */
export function hojeISO() {
  return paraISO(new Date())
}

export function paraISO(date) {
  const ano = date.getFullYear()
  const mes = String(date.getMonth() + 1).padStart(2, '0')
  const dia = String(date.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function somarDias(iso, dias) {
  const d = paraDate(iso)
  d.setDate(d.getDate() + dias)
  return paraISO(d)
}

/** Primeiro dia do mês da data informada (padrão: hoje). */
export function inicioDoMes(iso = hojeISO()) {
  return `${String(iso).slice(0, 7)}-01`
}

export function fimDoMes(iso = hojeISO()) {
  const d = paraDate(iso)
  return paraISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

export function ehHoje(iso) {
  return String(iso).slice(0, 10) === hojeISO()
}

/** Iniciais para o avatar quando não há foto de perfil. */
export function iniciais(nome) {
  if (!nome) return '?'
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

export function duracao(minutos) {
  const total = Number(minutos ?? 0)
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto ? `${horas}h${String(resto).padStart(2, '0')}` : `${horas}h`
}

/** Rótulo e cor do status de um agendamento. */
export function rotuloStatus(status) {
  switch (status) {
    case 'CONFIRMADO':
      return { texto: 'Confirmado', classe: 'badge--info' }
    case 'CONCLUIDO':
      return { texto: 'Concluído', classe: 'badge--sucesso' }
    case 'CANCELADO':
      return { texto: 'Cancelado', classe: 'badge--erro' }
    default:
      return { texto: status ?? '—', classe: '' }
  }
}

export function rotuloPeriodicidade(periodicidade) {
  switch (periodicidade) {
    case 'MENSAL':
      return 'por mês'
    case 'TRIMESTRAL':
      return 'por trimestre'
    case 'ANUAL':
      return 'por ano'
    default:
      return ''
  }
}

export function rotuloAssinatura(status) {
  switch (status) {
    case 'ATIVA':
      return { texto: 'Ativa', classe: 'badge--sucesso' }
    case 'CANCELADA':
      return { texto: 'Cancelada', classe: 'badge--erro' }
    case 'EXPIRADA':
      return { texto: 'Expirada', classe: 'badge--aviso' }
    default:
      return { texto: status ?? '—', classe: '' }
  }
}

function paraDate(iso) {
  // Monta a data em horário local para evitar o deslocamento de fuso do UTC.
  const [ano, mes, dia] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(ano, (mes ?? 1) - 1, dia ?? 1)
}
