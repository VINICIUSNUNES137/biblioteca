export default function Campo({ rotulo, erro, ajuda, as = 'input', children, ...props }) {
  const classe = `campo__controle${erro ? ' campo__controle--erro' : ''}`

  return (
    <label className="campo">
      {rotulo && <span className="campo__rotulo">{rotulo}</span>}
      {as === 'select' ? (
        <select className={classe} {...props}>
          {children}
        </select>
      ) : as === 'textarea' ? (
        <textarea className={classe} {...props} />
      ) : (
        <input className={classe} {...props} />
      )}
      {ajuda && !erro && <span className="campo__ajuda">{ajuda}</span>}
      {erro && <span className="campo__erro">{erro}</span>}
    </label>
  )
}
