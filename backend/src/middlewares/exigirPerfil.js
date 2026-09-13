const ErroDeNegocio = require('../erros/ErroDeNegocio')

module.exports = function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(new ErroDeNegocio('SEM_USUARIO', 'Operador não identificado.', 400))
    }
    if (!perfis.includes(req.usuario.perfil)) {
      return next(new ErroDeNegocio('PERFIL_INSUFICIENTE', 'Seu perfil não permite esta ação.', 403))
    }
    next()
  }
}
