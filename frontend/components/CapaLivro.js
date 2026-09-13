import { urlCapa } from '@/lib/api'

export default function CapaLivro({ capa, titulo, tamanho = 'media' }) {
  const fonte = urlCapa(capa)
  return (
    <div className={`capa capa--${tamanho}`} aria-hidden={!titulo}>
      {fonte ? (
        <img src={fonte} alt="" />
      ) : (
        <span>{(titulo || 'Livro').slice(0, 2).toUpperCase()}</span>
      )}
    </div>
  )
}
