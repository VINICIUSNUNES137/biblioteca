const URL_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function urlCapa(capa) {
  if (!capa) return null
  if (capa.startsWith('http') || capa.startsWith('blob:')) return capa
  return `${URL_API}/uploads/capas/${capa}`
}

export async function requisitar(metodo, caminho, corpo) {
  const id = typeof window !== 'undefined' ? localStorage.getItem('usuarioId') : null
  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: metodo,
    headers: {
      ...(corpo ? { 'Content-Type': 'application/json' } : {}),
      ...(id ? { 'x-usuario-id': id } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })

  if (resposta.status === 204) return null

  const dados = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(dados?.erro?.mensagem || 'Erro inesperado.')
  }
  return dados
}

export async function enviarArquivo(caminho, arquivo, campo = 'capa') {
  const id = typeof window !== 'undefined' ? localStorage.getItem('usuarioId') : null
  const dados = new FormData()
  dados.append(campo, arquivo)
  const resposta = await fetch(`${URL_API}${caminho}`, {
    method: 'POST',
    headers: { ...(id ? { 'x-usuario-id': id } : {}) },
    body: dados,
  })
  const json = await resposta.json().catch(() => ({}))
  if (!resposta.ok) {
    throw new Error(json?.erro?.mensagem || 'Não foi possível enviar o arquivo.')
  }
  return json
}

export const get = (caminho) => requisitar('GET', caminho)
export const post = (caminho, corpo) => requisitar('POST', caminho, corpo)
export const put = (caminho, corpo) => requisitar('PUT', caminho, corpo)
export const del = (caminho) => requisitar('DELETE', caminho)
