export default function EmptyState({ ilustracao, titulo, descricao, acao }) {
  return (
    <div className="vazio">
      {ilustracao && <div className="vazio__arte">{ilustracao}</div>}
      <h3>{titulo}</h3>
      {descricao && <p>{descricao}</p>}
      {acao && <div className="vazio__acao">{acao}</div>}
    </div>
  )
}

export function ArteLivros() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <rect x="18" y="22" width="28" height="52" rx="3" fill="#DEEBFF" stroke="#0C66E4" />
      <rect x="46" y="16" width="28" height="58" rx="3" fill="#E9F2FF" stroke="#0C66E4" />
      <rect x="74" y="26" width="28" height="48" rx="3" fill="#F1F2F4" stroke="#8590A2" />
      <path d="M24 34h16M24 42h12M52 28h16M52 36h10M80 38h16" stroke="#0C66E4" strokeOpacity=".45" />
    </svg>
  )
}

export function ArteBusca() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <circle cx="52" cy="44" r="22" stroke="#0C66E4" strokeWidth="3" fill="#E9F2FF" />
      <path d="M68 60l18 18" stroke="#0C66E4" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function ArteFila() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <circle cx="38" cy="42" r="12" fill="#DEEBFF" stroke="#0C66E4" />
      <circle cx="60" cy="42" r="12" fill="#E9F2FF" stroke="#0C66E4" />
      <circle cx="82" cy="42" r="12" fill="#F1F2F4" stroke="#8590A2" />
      <rect x="28" y="62" width="64" height="8" rx="4" fill="#DFE1E6" />
    </svg>
  )
}

export function ArteEmprestimo() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <rect x="28" y="20" width="44" height="56" rx="3" fill="#DEEBFF" stroke="#0C66E4" />
      <path d="M78 44h18m0 0-8-8m8 8-8 8" stroke="#0C66E4" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function ArtePessoas() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <circle cx="48" cy="34" r="12" fill="#DEEBFF" stroke="#0C66E4" />
      <path d="M28 70c2-14 12-20 20-20s18 6 20 20" fill="#E9F2FF" stroke="#0C66E4" />
      <circle cx="78" cy="38" r="10" fill="#F1F2F4" stroke="#8590A2" />
      <path d="M64 70c1-10 8-15 14-15s13 5 14 15" fill="#F7F8F9" stroke="#8590A2" />
    </svg>
  )
}
