const ErroDeNegocio = require('../erros/ErroDeNegocio')

function lancarSeDuplicado(erro, mensagens) {
  if (erro.code !== 'P2002') throw erro
  const campo = erro.meta?.target?.[0]
  const mensagem = mensagens[campo] || 'Registro duplicado.'
  throw new ErroDeNegocio('DUPLICADO', mensagem, 409)
}

module.exports = { lancarSeDuplicado }
