const prisma = require('../prisma')
const ErroDeNegocio = require('../erros/ErroDeNegocio')
const { lancarSeDuplicado } = require('../util/duplicado')
const fs = require('fs')
const path = require('path')
const { pastaCapas } = require('../middlewares/uploadCapa')

function validarLivro({ titulo, autor, isbn, ano }) {
  if (!titulo || !String(titulo).trim()) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Título é obrigatório.', 400)
  }
  if (!autor || !String(autor).trim()) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Autor é obrigatório.', 400)
  }
  if (!isbn || !String(isbn).trim()) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'ISBN é obrigatório.', 400)
  }
  if (ano == null || ano === '' || Number.isNaN(Number(ano))) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Ano é obrigatório.', 400)
  }
}

function dadosLivro(dados) {
  return {
    titulo: String(dados.titulo).trim(),
    autor: String(dados.autor).trim(),
    isbn: String(dados.isbn).trim(),
    ano: Number(dados.ano),
    editora: dados.editora ? String(dados.editora).trim() : null,
    categoria: dados.categoria ? String(dados.categoria).trim() : null,
    sinopse: dados.sinopse ? String(dados.sinopse).trim() : null,
    numeroPaginas: dados.numeroPaginas ? Number(dados.numeroPaginas) : null,
  }
}

function resumirLivro(livro) {
  return {
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    isbn: livro.isbn,
    ano: livro.ano,
    editora: livro.editora,
    categoria: livro.categoria,
    sinopse: livro.sinopse,
    numeroPaginas: livro.numeroPaginas,
    capa: livro.capa,
    criadoEm: livro.criadoEm,
    totalExemplares: livro.exemplares?.length || 0,
    disponiveis: (livro.exemplares || []).filter((item) => item.situacao === 'DISPONIVEL').length,
  }
}

async function listar(busca) {
  const where = busca
    ? {
        OR: [
          { titulo: { contains: busca } },
          { autor: { contains: busca } },
          { isbn: { contains: busca } },
          { editora: { contains: busca } },
          { categoria: { contains: busca } },
        ],
      }
    : {}

  const livros = await prisma.livro.findMany({
    where,
    include: { exemplares: true },
    orderBy: { titulo: 'asc' },
  })

  return livros.map(resumirLivro)
}

async function buscarPorId(id) {
  const livro = await prisma.livro.findUnique({
    where: { id: Number(id) },
    include: {
      exemplares: { orderBy: { codigo: 'asc' } },
    },
  })

  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)

  return {
    ...resumirLivro(livro),
    exemplares: livro.exemplares.map((exemplar) => ({
      id: exemplar.id,
      codigo: exemplar.codigo,
      situacao: exemplar.situacao,
    })),
  }
}

async function criar(dados) {
  validarLivro(dados)
  try {
    const livro = await prisma.livro.create({
      data: dadosLivro(dados),
      include: { exemplares: true },
    })
    return resumirLivro(livro)
  } catch (erro) {
    lancarSeDuplicado(erro, { isbn: 'ISBN já cadastrado.' })
  }
}

async function atualizar(id, dados) {
  const atual = await prisma.livro.findUnique({ where: { id: Number(id) } })
  if (!atual) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)
  validarLivro(dados)
  try {
    const livro = await prisma.livro.update({
      where: { id: Number(id) },
      data: dadosLivro(dados),
      include: { exemplares: true },
    })
    return resumirLivro(livro)
  } catch (erro) {
    lancarSeDuplicado(erro, { isbn: 'ISBN já cadastrado.' })
  }
}

async function salvarCapa(id, arquivo) {
  const livro = await prisma.livro.findUnique({ where: { id: Number(id) } })
  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)
  if (!arquivo) throw new ErroDeNegocio('DADOS_INVALIDOS', 'Envie um arquivo de capa.', 400)

  if (livro.capa) {
    const antigo = path.join(pastaCapas, livro.capa)
    if (fs.existsSync(antigo)) fs.unlinkSync(antigo)
  }

  const atualizado = await prisma.livro.update({
    where: { id: Number(id) },
    data: { capa: arquivo.filename },
    include: { exemplares: true },
  })
  return resumirLivro(atualizado)
}

async function excluir(id) {
  const livro = await prisma.livro.findUnique({
    where: { id: Number(id) },
    include: { exemplares: true },
  })
  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)
  if (livro.exemplares.length > 0) {
    throw new ErroDeNegocio('EM_USO', 'Exclua os exemplares antes de excluir o livro.', 409)
  }
  if (livro.capa) {
    const arquivo = path.join(pastaCapas, livro.capa)
    if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo)
  }
  await prisma.livro.delete({ where: { id: Number(id) } })
}

function formatarTombo(numero) {
  return `EX-${String(numero).padStart(4, '0')}`
}

async function proximoNumeroTombo(tx) {
  const lista = await tx.exemplar.findMany({ select: { codigo: true } })
  let max = 0
  for (const item of lista) {
    const match = String(item.codigo).match(/^EX-(\d+)$/i)
    if (match) max = Math.max(max, Number(match[1]))
  }
  return max + 1
}

async function adicionarExemplar(livroId, quantidade = 1) {
  const qtd = Number(quantidade)
  if (!Number.isInteger(qtd) || qtd < 1) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Informe quantos exemplares adicionar.', 400)
  }
  if (qtd > 50) {
    throw new ErroDeNegocio('DADOS_INVALIDOS', 'Dá para adicionar no máximo 50 de uma vez.', 400)
  }

  const livro = await prisma.livro.findUnique({ where: { id: Number(livroId) } })
  if (!livro) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Livro não encontrado.', 404)

  return prisma.$transaction(async (tx) => {
    const inicio = await proximoNumeroTombo(tx)
    const criados = []
    for (let i = 0; i < qtd; i++) {
      criados.push(
        await tx.exemplar.create({
          data: {
            codigo: formatarTombo(inicio + i),
            livroId: Number(livroId),
            situacao: 'DISPONIVEL',
          },
        })
      )
    }
    return criados
  })
}

async function excluirExemplar(id) {
  const exemplar = await prisma.exemplar.findUnique({ where: { id: Number(id) } })
  if (!exemplar) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Exemplar não encontrado.', 404)
  if (exemplar.situacao !== 'DISPONIVEL') {
    throw new ErroDeNegocio('EM_USO', 'Só é possível excluir exemplar disponível.', 409)
  }
  await prisma.exemplar.delete({ where: { id: Number(id) } })
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  salvarCapa,
  excluir,
  adicionarExemplar,
  excluirExemplar,
}
