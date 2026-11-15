import { NavLink } from 'react-router'
import styles from './Header.module.css'

export function Header() {
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
          <NavLink
            to="/emissor/login"
            className={({ isActive }) =>
              `${styles.navLink}${isActive ? ` ${styles.navLinkActive}` : ''}`
            }
          >
            Área do emissor
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
