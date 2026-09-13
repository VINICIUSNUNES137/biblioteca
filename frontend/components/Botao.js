export default function Botao({ children, variante = 'primario', ...props }) {
  return (
    <button type="button" className={`botao botao--${variante}`} {...props}>
      {children}
    </button>
  )
}
