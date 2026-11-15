import { type PerfilUsuario } from '@/lib/session'

/**
 * Calcula o destino pós-login com base no perfil do usuário e na rota de origem (from).
 * Garante que o usuário só é redirecionado para a rota solicitada se tiver permissão.
 */
export function obterDestinoAposLogin(
  perfil: PerfilUsuario,
  from?: string,
): string {
  if (!from || from === '/emissor/login') {
    return perfil === 'ADMINISTRADOR' ? '/admin/emissores' : '/emissor/painel'
  }
  if (from.startsWith('/admin')) {
    return perfil === 'ADMINISTRADOR' ? from : '/emissor/painel'
  }
  if (from.startsWith('/emissor')) {
    return perfil === 'EMISSOR' ? from : '/admin/emissores'
  }
  return from
}
