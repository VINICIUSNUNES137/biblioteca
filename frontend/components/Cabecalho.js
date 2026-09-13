'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usarUsuario } from '@/lib/usuario'
import Avatar from '@/components/Avatar'

const ITENS = [{ href: '/livros', rotulo: 'Catálogo' }]

export default function Cabecalho() {
  const caminho = usePathname()
  const { usuario, erro } = usarUsuario()

  return (
    <header className="cabecalho">
      <Link href="/livros" className="cabecalho__marca">
        <span className="cabecalho__logo" aria-hidden="true">
          B
        </span>
        Biblioteca
      </Link>
      <nav className="cabecalho__nav">
        {ITENS.map((item) => (
          <Link key={item.href} href={item.href} className={caminho.startsWith(item.href) ? 'ativo' : ''}>
            {item.rotulo}
          </Link>
        ))}
      </nav>
      <div className="operador">
        <Avatar nome={usuario?.nome} />
        <div>
          <strong>{usuario?.nome || (erro ? 'Sem operador' : 'Carregando…')}</strong>
          <small>{erro || 'Bibliotecário'}</small>
        </div>
      </div>
    </header>
  )
}
