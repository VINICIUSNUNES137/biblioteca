const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')

async function registrar(db, dados) {
  const cliente = db || prisma
  return cliente.movimentacao.create({
    data: {
      livroId: Number(dados.livroId),
      exemplarId: dados.exemplarId ? Number(dados.exemplarId) : null,
      leitorId: dados.leitorId ? Number(dados.leitorId) : null,
      tipo: dados.tipo,
      data: dados.data || new Date(),
      detalhe: dados.detalhe || null,
      multa: dados.multa != null ? Number(dados.multa) : null,
    },
  })
}

async function listarPorLivro(livroId) {
  const livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } })
  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)

  const lista = await prisma.movimentacao.findMany({
    where: { livroId: Number(livroId) },
    include: { leitor: true, exemplar: true },
    orderBy: [{ data: 'desc' }, { id: 'desc' }],
  })

  return lista.map((item) => ({
    ...item,
    multa: item.multa != null ? Number(item.multa) : null,
  }))
}

module.exports = { registrar, listarPorLivro }
