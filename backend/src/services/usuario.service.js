const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')
const { lancarSeDuplicado } = require('../util/duplicado')

const PERFIS = ['LEITOR', 'BIBLIOTECARIO']

function validarCampos({ nome, email, perfil }) {
  if (!nome || !String(nome).trim()) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Nome é obrigatório.', 400)
  }
  if (!email || !String(email).trim()) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'E-mail é obrigatório.', 400)
  }
  if (perfil && !PERFIS.includes(perfil)) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Perfil deve ser LEITOR ou BIBLIOTECARIO.', 400)
  }
}

async function listar() {
  return prisma.usuario.findMany({ orderBy: { nome: 'asc' } })
}

async function buscarPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id: Number(id) } })
  if (!usuario) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Usuário não encontrado.', 404)
  return usuario
}

async function criar(dados) {
  validarCampos(dados)
  try {
    return await prisma.usuario.create({
      data: {
        nome: String(dados.nome).trim(),
        email: String(dados.email).trim(),
        perfil: dados.perfil || 'LEITOR',
      },
    })
  } catch (erro) {
    lancarSeDuplicado(erro, { email: 'E-mail já cadastrado.' })
  }
}

async function atualizar(id, dados) {
  await buscarPorId(id)
  validarCampos(dados)
  try {
    return await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        nome: String(dados.nome).trim(),
        email: String(dados.email).trim(),
        perfil: dados.perfil,
      },
    })
  } catch (erro) {
    lancarSeDuplicado(erro, { email: 'E-mail já cadastrado.' })
  }
}

async function excluir(id) {
  const usuario = await buscarPorId(id)
  if (usuario.perfil === 'BIBLIOTECARIO') {
    const outros = await prisma.usuario.count({
      where: { perfil: 'BIBLIOTECARIO', id: { not: Number(id) } },
    })
    if (outros === 0) {
      throw new ErroDeNegocio('EM_USO', 'Não é possível excluir o único bibliotecário.', 409)
    }
  }
  const emprestimosAtivos = await prisma.emprestimo.count({
    where: { leitorId: Number(id), devolvidoEm: null },
  })
  if (emprestimosAtivos > 0) {
    throw new ErroDeNegocio('EM_USO', 'Usuário tem empréstimo ativo e não pode ser excluído.', 409)
  }
  await prisma.usuario.delete({ where: { id: Number(id) } })
}

async function situacaoDoLeitor(id) {
  await buscarPorId(id)
  const agora = new Date()
  const pendencias = await prisma.emprestimo.findMany({
    where: { leitorId: Number(id), devolvidoEm: null, previstoPara: { lt: agora } },
    include: { exemplar: { include: { livro: true } } },
    orderBy: { previstoPara: 'asc' },
  })
  return {
    bloqueado: pendencias.length > 0,
    pendencias: pendencias.map((emp) => ({
      emprestimoId: emp.id,
      titulo: emp.exemplar.livro.titulo,
      previstoPara: emp.previstoPara,
    })),
  }
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir, situacaoDoLeitor }
