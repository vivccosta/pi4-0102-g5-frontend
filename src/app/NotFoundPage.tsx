import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <section>
      <h1>Página não encontrada</h1>
      <p>O endereço solicitado não foi encontrado.</p>
      <p>
        <Link to="/verificar">Voltar para a verificação de certificados</Link>
      </p>
    </section>
  )
}
