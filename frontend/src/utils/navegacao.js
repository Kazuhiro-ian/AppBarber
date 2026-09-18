/**
 * Menu de cada perfil, usado tanto pela sidebar (desktop) quanto pela
 * bottom navigation (mobile).
 *
 * `principal: true` marca os itens que cabem na barra inferior do celular —
 * os demais entram no menu "Mais".
 */

const MENUS = {
  CLIENTE: [
    { rotulo: 'Início', icone: '🏠', para: '/', principal: true, exato: true },
    { rotulo: 'Agendar', icone: '✂️', para: '/agendar', principal: true },
    { rotulo: 'Agendamentos', icone: '📅', para: '/meus-agendamentos', principal: true },
    { rotulo: 'Serviços', icone: '💈', para: '/servicos', principal: true },
    { rotulo: 'Perfil', icone: '👤', para: '/perfil', principal: true },
  ],
  BARBEIRO: [
    { rotulo: 'Painel', icone: '📊', para: '/barbeiro', principal: true, exato: true },
    { rotulo: 'Agenda do dia', icone: '📅', para: '/barbeiro/agenda', principal: true },
    { rotulo: 'Estoque', icone: '📦', para: '/barbeiro/estoque', principal: true },
    { rotulo: 'Perfil', icone: '👤', para: '/barbeiro/perfil', principal: true },
  ],
  ADMIN: [
    {
      grupo: 'Operação',
      itens: [
        { rotulo: 'Painel', icone: '📊', para: '/admin', principal: true, exato: true },
        { rotulo: 'Agenda geral', icone: '📅', para: '/admin/agenda', principal: true },
        { rotulo: 'Clientes', icone: '🧑‍🤝‍🧑', para: '/admin/clientes' },
      ],
    },
    {
      grupo: 'Cadastros',
      itens: [
        { rotulo: 'Serviços', icone: '💈', para: '/admin/servicos' },
        { rotulo: 'Barbeiros', icone: '✂️', para: '/admin/barbeiros' },
        { rotulo: 'Planos', icone: '⭐', para: '/admin/planos' },
      ],
    },
    {
      grupo: 'Gestão',
      itens: [
        { rotulo: 'Estoque', icone: '📦', para: '/admin/estoque', principal: true },
        { rotulo: 'Despesas', icone: '🧾', para: '/admin/despesas' },
        { rotulo: 'Financeiro', icone: '💰', para: '/admin/financeiro', principal: true },
      ],
    },
    {
      grupo: 'Conta',
      itens: [{ rotulo: 'Perfil', icone: '👤', para: '/perfil' }],
    },
  ],
}

/** Grupos do menu (a sidebar usa os títulos; CLIENTE/BARBEIRO têm grupo único). */
export function gruposDoPerfil(perfil) {
  const menu = MENUS[perfil]
  if (!menu) return []
  return Array.isArray(menu) && menu[0]?.grupo ? menu : [{ grupo: null, itens: menu }]
}

/** Lista achatada de todos os itens do perfil. */
export function itensDoPerfil(perfil) {
  return gruposDoPerfil(perfil).flatMap((g) => g.itens)
}

/** Até 4 atalhos para a barra inferior; o 5º slot é o botão "Mais". */
export function itensPrincipais(perfil) {
  return itensDoPerfil(perfil)
    .filter((item) => item.principal)
    .slice(0, 4)
}

/** Itens que sobraram e aparecem no menu "Mais" do celular. */
export function itensSecundarios(perfil) {
  const principais = new Set(itensPrincipais(perfil).map((i) => i.para))
  return itensDoPerfil(perfil).filter((item) => !principais.has(item.para))
}

/** Rota inicial de cada perfil após o login. */
export function rotaInicial(perfil) {
  switch (perfil) {
    case 'ADMIN':
      return '/admin'
    case 'BARBEIRO':
      return '/barbeiro'
    default:
      return '/'
  }
}

export function rotuloPerfil(perfil) {
  switch (perfil) {
    case 'ADMIN':
      return 'Administrador'
    case 'BARBEIRO':
      return 'Barbeiro'
    case 'CLIENTE':
      return 'Cliente'
    default:
      return ''
  }
}
