export default function Avatar({ nome }) {
  const iniciais = (nome || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()

  return <span className="avatar">{iniciais}</span>
}
