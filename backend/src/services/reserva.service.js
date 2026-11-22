const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')
const { garantirLeitorLiberado } = require('./emprestimo.service')
const movimentacao = require('./movimentacao.service')

async function posicaoNaFila(reserva, db = prisma) {
  return (
    1 +
    (await db.reserva.count({
      where: {
        livroId: reserva.livroId,
        situacao: 'AGUARDANDO',
        OR: [
          { criadoEm: { lt: reserva.criadoEm } },
          { criadoEm: reserva.criadoEm, id: { lt: reserva.id } },
        ],
      },
    }))
  )
}

async function reservar({ livroId, leitorId }) {
  if (!livroId) throw new ErroDeNegocio('DADOS_INVALIDOS', 'Informe o livro.', 400)
  if (!leitorId) throw new ErroDeNegocio('DADOS_INVALIDOS', 'Informe o leitor.', 400)

  return prisma.$transaction((tx) => criarReserva(tx, Number(livroId), Number(leitorId)))
}

async function criarReserva(tx, livroId, leitorId) {
  const livro = await tx.livro.findUnique({ where: { id: livroId } })
  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)

  const leitor = await tx.usuario.findUnique({ where: { id: leitorId } })
  if (!leitor) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Leitor não encontrado.', 404)
  if (leitor.perfil !== 'LEITOR') {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Reserva só pode ser feita para um leitor.', 400)
  }

  await garantirLeitorLiberado(leitorId, tx)

  const disponiveis = await tx.exemplar.count({
    where: { livroId, situacao: 'DISPONIVEL' },
  })
  if (disponiveis > 0) {
    throw new ErroDeNegocio(
      'HA_EXEMPLAR_LIVRE',
      'Há exemplar disponível — faça o empréstimo em vez de reservar.',
      409
    )
  }

  const jaTem = await tx.reserva.findFirst({
    where: { livroId, leitorId, situacao: 'AGUARDANDO' },
  })
  if (jaTem) {
    throw new ErroDeNegocio('RESERVA_DUPLICADA', 'Este leitor já está na fila deste livro.', 409)
  }

  const jaEmprestado = await tx.emprestimo.findFirst({
    where: {
      leitorId,
      devolvidoEm: null,
      exemplar: { livroId },
    },
  })
  if (jaEmprestado) {
    throw new ErroDeNegocio('JA_COM_EXEMPLAR', 'Este leitor já está com um exemplar deste livro.', 409)
  }

  const reserva = await tx.reserva.create({
    data: { livroId, leitorId },
    include: { livro: true, leitor: true },
  })

  const posicao = await posicaoNaFila(reserva, tx)
  await movimentacao.registrar(tx, {
    tipo: 'RESERVA',
    livroId: reserva.livroId,
    leitorId: reserva.leitorId,
    reservaId: reserva.id,
    data: reserva.criadoEm,
    detalhe: `${reserva.leitor.nome} entrou na fila (${posicao}º lugar).`,
  })

  return { ...reserva, posicao }
}

async function comPosicao(reservas) {
  const resultado = []
  for (const reserva of reservas) {
    resultado.push({
      ...reserva,
      posicao: reserva.situacao === 'AGUARDANDO' ? await posicaoNaFila(reserva) : null,
    })
  }
  return resultado
}

async function listarTodas(situacao) {
  const reservas = await prisma.reserva.findMany({
    where: situacao ? { situacao } : {},
    include: { livro: true, leitor: true },
    orderBy: { criadoEm: 'desc' },
  })
  return comPosicao(reservas)
}

async function listarPorLeitor(leitorId) {
  const reservas = await prisma.reserva.findMany({
    where: { leitorId: Number(leitorId) },
    include: { livro: true, leitor: true },
    orderBy: { criadoEm: 'desc' },
  })
  return comPosicao(reservas)
}

async function listarFilaDoLivro(livroId) {
  const fila = await prisma.reserva.findMany({
    where: { livroId: Number(livroId), situacao: 'AGUARDANDO' },
    include: { leitor: true },
    orderBy: [{ criadoEm: 'asc' }, { id: 'asc' }],
  })
  return fila.map((reserva, indice) => ({ ...reserva, posicao: indice + 1 }))
}

async function cancelar(id) {
  const reserva = await prisma.reserva.findUnique({
    where: { id: Number(id) },
    include: { leitor: true },
  })
  if (!reserva) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Reserva não encontrada.', 404)
  await prisma.$transaction(async (tx) => {
    const canceladas = await tx.reserva.updateMany({
      where: { id: reserva.id, situacao: 'AGUARDANDO' },
      data: { situacao: 'CANCELADA' },
    })
    if (!canceladas.count) {
      throw new ErroDeNegocio('ESTADO_INVALIDO', 'Só é possível cancelar reserva aguardando.', 409)
    }
    await movimentacao.registrar(tx, {
      tipo: 'RESERVA_CANCELADA',
      livroId: reserva.livroId,
      leitorId: reserva.leitorId,
      reservaId: reserva.id,
      data: new Date(),
      detalhe: `${reserva.leitor.nome} saiu da fila.`,
    })
  })
}

module.exports = { reservar, listarTodas, listarPorLeitor, listarFilaDoLivro, cancelar, posicaoNaFila }
