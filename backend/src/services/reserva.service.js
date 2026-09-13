const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')
const { garantirLeitorLiberado } = require('./emprestimo.service')
const movimentacao = require('./movimentacao.service')

async function posicaoNaFila(reserva) {
  return (
    1 +
    (await prisma.reserva.count({
      where: {
        livroId: reserva.livroId,
        situacao: 'AGUARDANDO',
        criadoEm: { lt: reserva.criadoEm },
      },
    }))
  )
}

async function reservar({ livroId, leitorId }) {
  if (!livroId) throw new ErroDeNegocio('DADOS_INVALIDOS', 'Informe o livro.', 400)
  if (!leitorId) throw new ErroDeNegocio('DADOS_INVALIDOS', 'Informe o leitor.', 400)

  const livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } })
  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)

  await garantirLeitorLiberado(leitorId)

  const disponiveis = await prisma.exemplar.count({
    where: { livroId: Number(livroId), situacao: 'DISPONIVEL' },
  })
  if (disponiveis > 0) {
    throw new ErroDeNegocio(
      'HA_EXEMPLAR_LIVRE',
      'Há exemplar disponível — faça o empréstimo em vez de reservar.',
      409
    )
  }

  const jaTem = await prisma.reserva.findFirst({
    where: { livroId: Number(livroId), leitorId: Number(leitorId), situacao: 'AGUARDANDO' },
  })
  if (jaTem) {
    throw new ErroDeNegocio('RESERVA_DUPLICADA', 'Este leitor já está na fila deste livro.', 409)
  }

  const jaEmprestado = await prisma.emprestimo.findFirst({
    where: {
      leitorId: Number(leitorId),
      devolvidoEm: null,
      exemplar: { livroId: Number(livroId) },
    },
  })
  if (jaEmprestado) {
    throw new ErroDeNegocio('JA_COM_EXEMPLAR', 'Este leitor já está com um exemplar deste livro.', 409)
  }

  const reserva = await prisma.reserva.create({
    data: { livroId: Number(livroId), leitorId: Number(leitorId) },
    include: { livro: true, leitor: true },
  })

  const posicao = await posicaoNaFila(reserva)
  await movimentacao.registrar(prisma, {
    tipo: 'RESERVA',
    livroId: reserva.livroId,
    leitorId: reserva.leitorId,
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
    orderBy: { criadoEm: 'asc' },
  })
  return fila.map((reserva, indice) => ({ ...reserva, posicao: indice + 1 }))
}

async function cancelar(id) {
  const reserva = await prisma.reserva.findUnique({
    where: { id: Number(id) },
    include: { leitor: true },
  })
  if (!reserva) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Reserva não encontrada.', 404)
  if (reserva.situacao !== 'AGUARDANDO') {
    throw new ErroDeNegocio('ESTADO_INVALIDO', 'Só é possível cancelar reserva aguardando.', 409)
  }
  await prisma.reserva.update({
    where: { id: Number(id) },
    data: { situacao: 'CANCELADA' },
  })
  await movimentacao.registrar(prisma, {
    tipo: 'RESERVA_CANCELADA',
    livroId: reserva.livroId,
    leitorId: reserva.leitorId,
    data: new Date(),
    detalhe: `${reserva.leitor.nome} saiu da fila.`,
  })
}

module.exports = { reservar, listarTodas, listarPorLeitor, listarFilaDoLivro, cancelar, posicaoNaFila }
