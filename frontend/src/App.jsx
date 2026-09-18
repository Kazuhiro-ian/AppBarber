import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { AppLayout } from './components/layout/AppLayout'
import { RotaProtegida, RotaPublica } from './components/RotaProtegida'

import Login from './pages/auth/Login'
import CriarConta from './pages/auth/CriarConta'
import Perfil from './pages/Perfil'
import NaoEncontrada from './pages/NaoEncontrada'

import HomeCliente from './pages/cliente/HomeCliente'
import AgendarHorario from './pages/cliente/AgendarHorario'
import MeusAgendamentos from './pages/cliente/MeusAgendamentos'
import ServicosAssinaturas from './pages/cliente/ServicosAssinaturas'

import PainelBarbeiro from './pages/barbeiro/PainelBarbeiro'
import AgendaDia from './pages/barbeiro/AgendaDia'
import PerfilBarbeiro from './pages/barbeiro/PerfilBarbeiro'

import PainelAdmin from './pages/admin/PainelAdmin'
import AgendaGeral from './pages/admin/AgendaGeral'
import Clientes from './pages/admin/Clientes'
import GestaoServicos from './pages/admin/GestaoServicos'
import GestaoBarbeiros from './pages/admin/GestaoBarbeiros'
import GestaoPlanos from './pages/admin/GestaoPlanos'
import GestaoEstoque from './pages/admin/GestaoEstoque'
import GestaoDespesas from './pages/admin/GestaoDespesas'
import GestaoFinanceira from './pages/admin/GestaoFinanceira'

import './styles/theme.css'
import './styles/layout.css'
import './styles/components.css'

/**
 * Mapa de rotas por perfil. O `RotaProtegida` decide a navegação no cliente;
 * a autorização de verdade continua sendo a do backend, a cada requisição.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Autenticação */}
            <Route
              path="/login"
              element={
                <RotaPublica>
                  <Login />
                </RotaPublica>
              }
            />
            <Route
              path="/criar-conta"
              element={
                <RotaPublica>
                  <CriarConta />
                </RotaPublica>
              }
            />

            {/* Área autenticada */}
            <Route
              element={
                <RotaProtegida>
                  <AppLayout />
                </RotaProtegida>
              }
            >
              {/* Cliente */}
              <Route
                index
                element={
                  <RotaProtegida perfis={['CLIENTE']}>
                    <HomeCliente />
                  </RotaProtegida>
                }
              />
              <Route
                path="agendar"
                element={
                  <RotaProtegida perfis={['CLIENTE']}>
                    <AgendarHorario />
                  </RotaProtegida>
                }
              />
              <Route
                path="meus-agendamentos"
                element={
                  <RotaProtegida perfis={['CLIENTE']}>
                    <MeusAgendamentos />
                  </RotaProtegida>
                }
              />
              <Route
                path="servicos"
                element={
                  <RotaProtegida perfis={['CLIENTE']}>
                    <ServicosAssinaturas />
                  </RotaProtegida>
                }
              />

              {/* Comum aos três perfis */}
              <Route path="perfil" element={<Perfil />} />

              {/* Barbeiro */}
              <Route
                path="barbeiro"
                element={
                  <RotaProtegida perfis={['BARBEIRO']}>
                    <PainelBarbeiro />
                  </RotaProtegida>
                }
              />
              <Route
                path="barbeiro/agenda"
                element={
                  <RotaProtegida perfis={['BARBEIRO']}>
                    <AgendaDia />
                  </RotaProtegida>
                }
              />
              <Route
                path="barbeiro/estoque"
                element={
                  <RotaProtegida perfis={['BARBEIRO']}>
                    <GestaoEstoque />
                  </RotaProtegida>
                }
              />
              <Route
                path="barbeiro/perfil"
                element={
                  <RotaProtegida perfis={['BARBEIRO']}>
                    <PerfilBarbeiro />
                  </RotaProtegida>
                }
              />

              {/* Administração */}
              <Route
                path="admin"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <PainelAdmin />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/agenda"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <AgendaGeral />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/clientes"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <Clientes />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/servicos"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <GestaoServicos />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/barbeiros"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <GestaoBarbeiros />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/planos"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <GestaoPlanos />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/estoque"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <GestaoEstoque />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/despesas"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <GestaoDespesas />
                  </RotaProtegida>
                }
              />
              <Route
                path="admin/financeiro"
                element={
                  <RotaProtegida perfis={['ADMIN']}>
                    <GestaoFinanceira />
                  </RotaProtegida>
                }
              />

              <Route path="*" element={<NaoEncontrada />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
