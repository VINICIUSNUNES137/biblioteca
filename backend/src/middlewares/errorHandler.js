const ErroDeNegocio = require('../erros/ErroDeNegocio')

module.exports = function errorHandler(err, req, res, next) {
  if (err instanceof ErroDeNegocio) {
    return res.status(err.status).json({
      erro: { codigo: err.codigo, mensagem: err.mensagem },
    })
  }

  console.error(err)
  return res.status(500).json({
    erro: { codigo: 'INTERNO', mensagem: 'Erro interno.' },
  })
}
