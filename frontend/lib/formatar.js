export function formatarData(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleDateString('pt-BR')
}

export function formatarDinheiro(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function paraInputData(valor) {
  const data = valor ? new Date(valor) : new Date()
  if (Number.isNaN(data.getTime())) return paraInputData(new Date())
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function rotuloPerfil(perfil) {
  return perfil === 'BIBLIOTECARIO' ? 'Bibliotecário' : 'Leitor'
}
