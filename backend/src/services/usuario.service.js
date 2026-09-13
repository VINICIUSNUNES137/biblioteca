const prisma = require('../prisma')

async function listar() {
  return prisma.usuario.findMany({ orderBy: { nome: 'asc' } })
}

module.exports = { listar }
