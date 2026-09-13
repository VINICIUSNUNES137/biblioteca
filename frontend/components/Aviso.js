export default function Aviso({ tipo = 'info', children, aoFechar }) {
  if (!children) return null

  return (
    <div className={`aviso aviso--${tipo}`}>
      <span>{children}</span>
      {aoFechar && (
        <button type="button" className="aviso__fechar" onClick={aoFechar} aria-label="Fechar aviso">
          ×
        </button>
      )}
    </div>
  )
}
