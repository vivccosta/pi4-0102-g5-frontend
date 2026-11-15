import { Outlet } from 'react-router'
import { Header } from '../components/ui/Header'
import { Footer } from '../components/ui/Footer'
import styles from './Layout.module.css'

export function Layout() {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
