const ErroDeNegocio = require('../erros/ErroDeNegocio')

function emDias(quantidade) {
  const data = new Date()
  data.setDate(data.getDate() + quantidade)
  return data
}

function parseDataInformada(valor) {
  if (valor == null || valor === '') return new Date()
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      throw new ErroDeNegocio('DADOS_INVALIDOS', 'Data inválida.', 400)
    }
    return valor
  }

  const texto = String(valor).trim()
  const soData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (soData) {
    const data = new Date(Number(soData[1]), Number(soData[2]) - 1, Number(soData[3]), 12, 0, 0)
    if (Number.isNaN(data.getTime())) {
      throw new ErroDeNegocio('DADOS_INVALIDOS', 'Data inválida.', 400)
    }
    return data
  }

  const data = new Date(texto)
  if (Number.isNaN(data.getTime())) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Data inválida.', 400)
  }
  return data
}

function diffEmDiasCalendario(depois, antes) {
  const fim = new Date(depois)
  const inicio = new Date(antes)
  const utcFim = Date.UTC(fim.getFullYear(), fim.getMonth(), fim.getDate())
  const utcInicio = Date.UTC(inicio.getFullYear(), inicio.getMonth(), inicio.getDate())
  return Math.round((utcFim - utcInicio) / (1000 * 60 * 60 * 24))
}

module.exports = { emDias, parseDataInformada, diffEmDiasCalendario }
