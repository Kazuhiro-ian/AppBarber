import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../ui/Avatar'
import {
  gruposDoPerfil,
  itensPrincipais,
  itensSecundarios,
  rotuloPerfil,
} from '../../utils/navegacao'

/**
 * Casca da aplicação.
 * Mobile  : topbar + bottom navigation (com menu "Mais" para o excedente).
 * Desktop : topbar + sidebar agrupada por seção.
 */
export function AppLayout() {
  const { usuario, perfil, sair } = useAuth()
  const navegar = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  const grupos = gruposDoPerfil(perfil)
  const principais = itensPrincipais(perfil)
  const secundarios = itensSecundarios(perfil)

  function encerrarSessao() {
    sair()
    navegar('/login', { replace: true })
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__marca">
          <span className="topbar__logo">AB</span>
          <span>AppBarber</span>
        </div>

        <div className="topbar__acoes">
          <div className="topbar__usuario">
            <Avatar nome={usuario?.nome} foto={usuario?.fotoPerfil} />
            <span className="somente-desktop">
              <span className="topbar__usuario-nome">{usuario?.nome}</span>
              <br />
              <span className="topbar__usuario-perfil">{rotuloPerfil(perfil)}</span>
            </span>
          </div>
          <button type="button" className="btn btn--contorno btn--pequeno" onClick={encerrarSessao}>
            Sair
          </button>
        </div>
      </header>

      <div className="app__corpo">
        <nav className="sidebar" aria-label="Menu principal">
          {grupos.map((grupo, indice) => (
            <div className="sidebar__grupo" key={grupo.grupo ?? indice}>
              {grupo.grupo && <div className="sidebar__titulo">{grupo.grupo}</div>}
              {grupo.itens.map((item) => (
                <NavLink
                  key={item.para}
                  to={item.para}
                  end={item.exato}
                  className={({ isActive }) => `nav-item ${isActive ? 'ativo' : ''}`}
                >
                  <span className="nav-item__icone" aria-hidden="true">
                    {item.icone}
                  </span>
                  {item.rotulo}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <main className="conteudo">
          <Outlet />
        </main>
      </div>

      <nav className="bottomnav" aria-label="Navegação">
        {principais.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            end={item.exato}
            className={({ isActive }) => `bottomnav__item ${isActive ? 'ativo' : ''}`}
          >
            <span className="bottomnav__icone" aria-hidden="true">
              {item.icone}
            </span>
            {item.rotulo}
          </NavLink>
        ))}

        {secundarios.length > 0 && (
          <button
            type="button"
            className={`bottomnav__item ${menuAberto ? 'ativo' : ''}`}
            onClick={() => setMenuAberto(true)}
          >
            <span className="bottomnav__icone" aria-hidden="true">
              ☰
            </span>
            Mais
          </button>
        )}
      </nav>

      {menuAberto && (
        <div className="menu-mais" onClick={() => setMenuAberto(false)} role="presentation">
          <div className="menu-mais__painel" onClick={(e) => e.stopPropagation()}>
            <div className="menu-mais__alca" />
            {secundarios.map((item) => (
              <NavLink
                key={item.para}
                to={item.para}
                end={item.exato}
                className={({ isActive }) => `nav-item ${isActive ? 'ativo' : ''}`}
                onClick={() => setMenuAberto(false)}
              >
                <span className="nav-item__icone" aria-hidden="true">
                  {item.icone}
                </span>
                {item.rotulo}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
