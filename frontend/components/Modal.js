export default function Modal({ aberto, titulo, descricao, aoFechar, children, rodape, tamanho = 'medio', perigo = false }) {
  if (!aberto) return null

  return (
    <div className="modal-fundo" onClick={aoFechar} role="presentation">
      <div
        className={`modal modal--${tamanho}${perigo ? ' modal--perigo' : ''}`}
        onClick={(evento) => evento.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal"
      >
        <div className="modal__topo">
          <div>
            <h2 id="titulo-modal">{titulo}</h2>
            {descricao && <p className="modal__descricao">{descricao}</p>}
          </div>
          <button type="button" className="modal__fechar" onClick={aoFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal__corpo">{children}</div>
        {rodape && <div className="modal__rodape">{rodape}</div>}
      </div>
    </div>
  )
}
