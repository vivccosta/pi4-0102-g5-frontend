import { Routes, Route, Navigate } from 'react-router'
import { Layout } from './app/Layout'
import { VerificarPage } from './features/verificacao/VerificarPage'
import { LoginPage, AuthProvider } from './features/auth'
import { PainelPage } from './features/painel/PainelPage'
import { RegistroPage } from './features/registro/RegistroPage'
import { AdminEmissoresPage } from './features/admin/AdminEmissoresPage'
import { NotFoundPage } from './app/NotFoundPage'

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/verificar" replace />} />
          <Route path="/verificar" element={<VerificarPage />} />
          <Route path="/emissor/login" element={<LoginPage />} />
          <Route path="/emissor/painel" element={<PainelPage />} />
          <Route path="/emissor/registrar" element={<RegistroPage />} />
          <Route path="/admin/emissores" element={<AdminEmissoresPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
