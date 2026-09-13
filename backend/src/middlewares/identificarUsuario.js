const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')

module.exports = async function identificarUsuario(req, res, next) {
  try {
    const id = Number(req.headers['x-usuario-id'])
    let usuario = id
      ? await prisma.usuario.findUnique({ where: { id } })
      : null

    if (!usuario || usuario.perfil !== 'BIBLIOTECARIO') {
      usuario = await prisma.usuario.findFirst({
        where: { perfil: 'BIBLIOTECARIO' },
        orderBy: { id: 'asc' },
      })
    }

    if (!usuario) {
      return next(
        new ErroDeNegocio(
          'SEM_BIBLIOTECARIO',
          'Cadastre um bibliotecário no banco para usar o sistema.',
          400
        )
      )
    }

    req.usuario = usuario
    next()
  } catch (erro) {
    next(erro)
  }
}
