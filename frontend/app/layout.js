import './globals.css'
import { ProvedorUsuario } from '@/lib/usuario'
import Cabecalho from '@/components/Cabecalho'

export const metadata = {
  title: 'Biblioteca',
  description: 'Gestão de acervo da biblioteca',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <ProvedorUsuario>
          <Cabecalho />
          <main className="conteudo">{children}</main>
        </ProvedorUsuario>
      </body>
    </html>
  )
}
