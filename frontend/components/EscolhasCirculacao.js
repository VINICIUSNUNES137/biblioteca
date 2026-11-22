import Avatar from '@/components/Avatar'
import CapaLivro from '@/components/CapaLivro'

function normalizar(texto) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function correspondeBusca(busca, ...campos) {
  const termo = normalizar(busca.trim())
  return campos.some((campo) => normalizar(campo).includes(termo))
}

export function BuscaEscolha({ rotulo, placeholder, valor, aoMudar, foco = false }) {
  return (
    <div className="busca escolha-busca">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        aria-label={rotulo}
        placeholder={placeholder}
        value={valor}
        onChange={(evento) => aoMudar(evento.target.value)}
        autoFocus={foco}
      />
    </div>
  )
}

export function GradeEscolhaLivros({ livros, aoEscolher, rotuloDisponibilidade }) {
  return (
    <div className="grade-escolha">
      {livros.map((livro) => (
        <button key={livro.id} type="button" className="escolha-livro" onClick={() => aoEscolher(livro)}>
          <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="escolha" />
          <span className="escolha-livro__corpo">
            <strong>{livro.titulo}</strong>
            <span>{livro.autor}</span>
            {rotuloDisponibilidade && <em>{rotuloDisponibilidade(livro)}</em>}
          </span>
        </button>
      ))}
    </div>
  )
}

export function LivroSelecionado({ livro }) {
  return (
    <div className="painel-escolha__livro">
      <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="escolha" />
      <div className="painel-escolha__titulo">
        <strong>{livro.titulo}</strong>
        <span>{livro.autor}</span>
      </div>
    </div>
  )
}

export function OpcoesLeitores({ leitores, selecionado, aoEscolher, desabilitado }) {
  return (
    <div className="opcoes">
      {leitores.map((leitor) => {
        const ativo = leitor.id === selecionado
        return (
          <button
            key={leitor.id}
            type="button"
            className={`opcao opcao-leitor${ativo ? ' is-selecionado' : ''}`}
            onClick={() => aoEscolher(leitor.id)}
            aria-pressed={ativo}
            disabled={desabilitado}
          >
            <Avatar nome={leitor.nome} />
            {leitor.nome}
          </button>
        )
      })}
    </div>
  )
}
