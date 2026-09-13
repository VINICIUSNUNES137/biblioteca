const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')
const { emDias, diffEmDiasCalendario, parseDataInformada } = require('../util/datas')
const movimentacao = require('./movimentacao.service')

const PRAZO_DIAS = 14
const LIMITE_ATIVOS = 3
const VALOR_DIA = 0.5

async function garantirLeitorLiberado(leitorId) {
  const atrasados = await prisma.emprestimo.count({
    where: { leitorId: Number(leitorId), devolvidoEm: null, previstoPara: { lt: new Date() } },
  })
  if (atrasados > 0) {
    throw new ErroDeNegocio(
      'LEITOR_BLOQUEADO',
      `Há ${atrasados} empréstimo(s) em atraso. Regularize para continuar.`,
      409
    )
  }
}

function calcularAtraso(emprestimo, agora = new Date()) {
  const dataFim = emprestimo.devolvidoEm || agora
  if (dataFim <= emprestimo.previstoPara && !emprestimo.devolvidoEm) {
    const atrasado = !emprestimo.devolvidoEm && emprestimo.previstoPara < agora
    return { atrasado, diasAtraso: 0, multaPrevista: 0 }
  }
  const dias = Math.max(0, diffEmDiasCalendario(dataFim, emprestimo.previstoPara))
  const atrasado = !emprestimo.devolvidoEm && emprestimo.previstoPara < agora
  return { atrasado, diasAtraso: atrasado ? dias : (emprestimo.devolvidoEm ? dias : 0), multaPrevista: dias * VALOR_DIA }
}

function serializarEmprestimo(emprestimo) {
  const extra = calcularAtraso(emprestimo)
  return {
    ...emprestimo,
    multa: emprestimo.multa != null ? Number(emprestimo.multa) : null,
    ...extra,
    multaPrevista: extra.multaPrevista,
  }
}

async function emprestar({ exemplarId, leitorId }) {
  if (!exemplarId || !leitorId) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Informe o exemplar e o leitor.', 400)
  }

  const leitor = await prisma.usuario.findUnique({ where: { id: Number(leitorId) } })
  if (!leitor) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Leitor não encontrado.', 404)
  if (leitor.perfil !== 'LEITOR') {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Empréstimo só pode ser feito para um leitor.', 400)
  }

  await garantirLeitorLiberado(leitorId)

  const exemplar = await prisma.exemplar.findUnique({ where: { id: Number(exemplarId) } })
  if (!exemplar) throw new ErroDeNegocio('EXEMPLAR_NAO_ENCONTRADO', 'Exemplar não existe.', 404)

  if (exemplar.situacao === 'RESERVADO') {
    const reservaAtendida = await prisma.reserva.findFirst({
      where: { livroId: exemplar.livroId, leitorId: Number(leitorId), situacao: 'ATENDIDA' },
      orderBy: { atendidaEm: 'desc' },
    })
    if (!reservaAtendida) {
      throw new ErroDeNegocio('EXEMPLAR_RESERVADO', 'Este exemplar está reservado para outro leitor.', 409)
    }
  } else if (exemplar.situacao !== 'DISPONIVEL') {
    throw new ErroDeNegocio('EXEMPLAR_INDISPONIVEL', 'Este exemplar não está disponível.', 409)
  }

  const ativos = await prisma.emprestimo.count({
    where: { leitorId: Number(leitorId), devolvidoEm: null },
  })
  if (ativos >= LIMITE_ATIVOS) {
    throw new ErroDeNegocio('LIMITE_ATINGIDO', `Leitor já tem ${LIMITE_ATIVOS} empréstimos ativos.`, 409)
  }

  const criado = await prisma.$transaction(async (tx) => {
    await tx.exemplar.update({
      where: { id: Number(exemplarId) },
      data: { situacao: 'EMPRESTADO' },
    })
    const emprestimo = await tx.emprestimo.create({
      data: {
        exemplarId: Number(exemplarId),
        leitorId: Number(leitorId),
        previstoPara: emDias(PRAZO_DIAS),
      },
      include: {
        leitor: true,
        exemplar: { include: { livro: true } },
      },
    })
    await movimentacao.registrar(tx, {
      tipo: 'EMPRESTIMO',
      livroId: emprestimo.exemplar.livroId,
      exemplarId: emprestimo.exemplarId,
      leitorId: emprestimo.leitorId,
      data: emprestimo.emprestadoEm,
      detalhe: `Saída do exemplar ${emprestimo.exemplar.codigo} para ${emprestimo.leitor.nome}.`,
    })
    return emprestimo
  })

  return serializarEmprestimo(criado)
}

async function listar({ ativos, atrasados, leitorId } = {}) {
  const where = {}
  if (leitorId) where.leitorId = Number(leitorId)
  if (ativos === 'true' || ativos === true) where.devolvidoEm = null
  if (atrasados === 'true' || atrasados === true) {
    where.devolvidoEm = null
    where.previstoPara = { lt: new Date() }
  }

  const lista = await prisma.emprestimo.findMany({
    where,
    include: {
      leitor: true,
      exemplar: { include: { livro: true } },
    },
    orderBy: { emprestadoEm: 'desc' },
  })

  return lista.map(serializarEmprestimo)
}

async function devolver(id, dados = {}) {
  const emp = await prisma.emprestimo.findUnique({
    where: { id: Number(id) },
    include: { exemplar: true, leitor: true },
  })
  if (!emp) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Empréstimo não existe.', 404)
  if (emp.devolvidoEm) {
    throw new ErroDeNegocio('JA_DEVOLVIDO', 'Este empréstimo já foi encerrado.', 409)
  }

  const agora = new Date()
  const devolvidoEm = parseDataInformada(dados.devolvidoEm)
  if (diffEmDiasCalendario(devolvidoEm, emp.emprestadoEm) < 0) {
    throw new ErroDeNegocio(
      'DADOS_INVALIDOS',
      'A data de devolução não pode ser anterior à saída do exemplar.',
      400
    )
  }
  if (diffEmDiasCalendario(devolvidoEm, agora) > 0) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'A data de devolução não pode ser no futuro.', 400)
  }

  const diasAtraso = Math.max(0, diffEmDiasCalendario(devolvidoEm, emp.previstoPara))
  const multa = diasAtraso * VALOR_DIA

  const resultado = await prisma.$transaction(async (tx) => {
    await tx.emprestimo.update({
      where: { id: Number(id) },
      data: { devolvidoEm, multa },
    })

    const proxima = await tx.reserva.findFirst({
      where: { livroId: emp.exemplar.livroId, situacao: 'AGUARDANDO' },
      orderBy: { criadoEm: 'asc' },
      include: { leitor: true },
    })

    if (proxima) {
      await tx.reserva.update({
        where: { id: proxima.id },
        data: { situacao: 'ATENDIDA', atendidaEm: devolvidoEm },
      })
      await movimentacao.registrar(tx, {
        tipo: 'RESERVA_ATENDIDA',
        livroId: emp.exemplar.livroId,
        exemplarId: emp.exemplarId,
        leitorId: proxima.leitorId,
        data: devolvidoEm,
        detalhe: `Exemplar ${emp.exemplar.codigo} separado para ${proxima.leitor.nome}.`,
      })
    }

    const situacao = proxima ? 'RESERVADO' : 'DISPONIVEL'
    await tx.exemplar.update({
      where: { id: emp.exemplarId },
      data: { situacao },
    })

    await movimentacao.registrar(tx, {
      tipo: 'DEVOLUCAO',
      livroId: emp.exemplar.livroId,
      exemplarId: emp.exemplarId,
      leitorId: emp.leitorId,
      data: devolvidoEm,
      detalhe: `Devolução do exemplar ${emp.exemplar.codigo} por ${emp.leitor.nome}.`,
      multa,
    })

    return {
      devolvidoEm,
      diasAtraso,
      multa,
      exemplar: { id: emp.exemplarId, situacao },
      reservaAtendida: proxima
        ? { id: proxima.id, leitorId: proxima.leitorId, leitor: proxima.leitor }
        : null,
    }
  })

  return resultado
}

module.exports = {
  PRAZO_DIAS,
  LIMITE_ATIVOS,
  VALOR_DIA,
  garantirLeitorLiberado,
  emprestar,
  listar,
  devolver,
}
