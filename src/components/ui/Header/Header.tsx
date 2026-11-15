import { NavLink } from 'react-router'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '../Button'
import styles from './Header.module.css'

export function Header() {
  const { session, logout } = useAuth()

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.wordmark} aria-label="Timbro — página inicial">
          Timbro
        </NavLink>
        <nav className={styles.nav} aria-label="Navegação principal">
          <NavLink
            to="/verificar"
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ''}`
            }
          >
            Verificar certificado
          </NavLink>
          {session ? (
            <>
              <span className={styles.userName}>{session.nome}</span>
              {session.perfil === 'EMISSOR' ? (
                <NavLink className={styles.navLink} to="/emissor/painel">Painel</NavLink>
              ) : (
                <NavLink className={styles.navLink} to="/admin/emissores">Administração</NavLink>
              )}
              <Button type="button" variant="secondary" size="sm" onClick={logout}>
                Sair
              </Button>
            </>
          ) : (
            <NavLink
              to="/emissor/login"
              className={({ isActive }) =>
                `${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ''}`
              }
            >
              Área do emissor
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  )
}
