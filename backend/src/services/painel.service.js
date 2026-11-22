const prisma = require('../prisma')
const { VALOR_DIA } = require('./emprestimo.service')
const { diffEmDiasCalendario } = require('../util/datas')

async function resumo() {
  const agora = new Date()

  const emprestadosAgora = await prisma.emprestimo.count({ where: { devolvidoEm: null } })
  const emAtraso = await prisma.emprestimo.count({
    where: { devolvidoEm: null, previstoPara: { lt: agora } },
  })
  const filaTotal = await prisma.reserva.count({ where: { situacao: 'AGUARDANDO' } })

  const devolvidos = await prisma.emprestimo.findMany({
    where: { devolvidoEm: { not: null } },
    select: { emprestadoEm: true, devolvidoEm: true },
  })
  const tempoMedioDias = devolvidos.length
    ? Math.round(
        (devolvidos.reduce(
          (soma, emp) => soma + diffEmDiasCalendario(emp.devolvidoEm, emp.emprestadoEm),
          0
        ) /
          devolvidos.length) *
          10
      ) / 10
    : 0

  const todosEmprestimos = await prisma.emprestimo.findMany({
    include: { exemplar: { include: { livro: true } } },
  })
  const contagemPorLivro = new Map()
  for (const emp of todosEmprestimos) {
    const livro = emp.exemplar.livro
    const atual = contagemPorLivro.get(livro.id) || { livro, total: 0 }
    atual.total += 1
    contagemPorLivro.set(livro.id, atual)
  }
  const livrosMaisEmprestados = [...contagemPorLivro.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((item) => ({ id: item.livro.id, livro: item.livro, total: item.total }))

  const atrasados = await prisma.emprestimo.findMany({
    where: { devolvidoEm: null, previstoPara: { lt: agora } },
    include: { leitor: true, exemplar: { include: { livro: true } } },
  })
  const porLeitor = new Map()
  for (const emp of atrasados) {
    const atual = porLeitor.get(emp.leitorId) || { id: emp.leitorId, usuario: emp.leitor, atrasos: 0 }
    atual.atrasos += 1
    porLeitor.set(emp.leitorId, atual)
  }

  const reservasAguardando = await prisma.reserva.findMany({
    where: { situacao: 'AGUARDANDO' },
    include: { livro: true },
  })
  const filaPorLivro = new Map()
  for (const reserva of reservasAguardando) {
    const atual = filaPorLivro.get(reserva.livroId) || { id: reserva.livroId, livro: reserva.livro, aguardando: 0 }
    atual.aguardando += 1
    filaPorLivro.set(reserva.livroId, atual)
  }

  return {
    emprestadosAgora,
    emAtraso,
    tempoMedioDias,
    filaTotal,
    valorDiaMulta: VALOR_DIA,
    livrosMaisEmprestados,
    leitoresBloqueados: [...porLeitor.values()],
    filaReservas: [...filaPorLivro.values()].sort((a, b) => b.aguardando - a.aguardando),
  }
}

module.exports = { resumo }
