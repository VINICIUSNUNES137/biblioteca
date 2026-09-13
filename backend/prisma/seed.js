require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const pastaCapas = path.join(__dirname, '../uploads/capas')

function escapar(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function gravarCapa({ arquivo, fundo, faixa, titulo, autor }) {
  fs.mkdirSync(pastaCapas, { recursive: true })
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="480" viewBox="0 0 320 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${fundo}"/>
      <stop offset="1" stop-color="${faixa}"/>
    </linearGradient>
  </defs>
  <rect width="320" height="480" fill="url(#g)"/>
  <rect x="24" y="24" width="272" height="432" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2"/>
  <rect x="0" y="168" width="320" height="8" fill="rgba(255,255,255,0.18)"/>
  <text x="40" y="230" fill="#fff" font-family="Georgia, serif" font-size="26" font-weight="700">${escapar(titulo)}</text>
  <text x="40" y="270" fill="rgba(255,255,255,0.85)" font-family="Georgia, serif" font-size="14">${escapar(autor)}</text>
  <text x="40" y="430" fill="rgba(255,255,255,0.55)" font-family="Arial, sans-serif" font-size="11" letter-spacing="2">BIBLIOTECA</text>
</svg>`
  fs.writeFileSync(path.join(pastaCapas, arquivo), svg)
}

async function main() {
  await prisma.exemplar.deleteMany()
  await prisma.livro.deleteMany()
  await prisma.usuario.deleteMany()

  gravarCapa({ arquivo: 'dom-casmurro.svg', fundo: '#1B3A4B', faixa: '#C9A227', titulo: 'Dom Casmurro', autor: 'Machado de Assis' })
  gravarCapa({ arquivo: 'o-cortico.svg', fundo: '#8C2F0F', faixa: '#E8B86D', titulo: 'O Cortiço', autor: 'Aluísio Azevedo' })
  gravarCapa({ arquivo: 'grande-sertao.svg', fundo: '#3D4A2A', faixa: '#C4A574', titulo: 'Grande Sertão', autor: 'Guimarães Rosa' })
  gravarCapa({ arquivo: 'hora-da-estrela.svg', fundo: '#3B1F4A', faixa: '#E0B0FF', titulo: 'A Hora da Estrela', autor: 'Clarice Lispector' })
  gravarCapa({ arquivo: 'capitaes.svg', fundo: '#0B3D5C', faixa: '#E6C07B', titulo: 'Capitães da Areia', autor: 'Jorge Amado' })

  const carla = await prisma.usuario.create({
    data: { nome: 'Carla Mendes', email: 'carla@biblioteca.local', perfil: 'BIBLIOTECARIO' },
  })

  await prisma.livro.create({
    data: {
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
      isbn: '9788535911664',
      ano: 1899,
      editora: 'Companhia das Letras',
      categoria: 'Clássico',
      numeroPaginas: 256,
      capa: 'dom-casmurro.svg',
      sinopse: 'Bento Santiago relembra o amor por Capitu e a dúvida que nunca o abandonou. Um retrato da memória, do ciúme e da ambiguidade.',
      exemplares: { create: [{ codigo: 'EX-0001' }, { codigo: 'EX-0002' }] },
    },
  })

  await prisma.livro.create({
    data: {
      titulo: 'O Cortiço',
      autor: 'Aluísio Azevedo',
      isbn: '9788508153381',
      ano: 1890,
      editora: 'Martin Claret',
      categoria: 'Naturalismo',
      numeroPaginas: 368,
      capa: 'o-cortico.svg',
      sinopse: 'A vida coletiva num cortiço do Rio de Janeiro, com ambição, desejo e a força do meio sobre as pessoas.',
      exemplares: { create: [{ codigo: 'EX-0003' }] },
    },
  })

  await prisma.livro.create({
    data: {
      titulo: 'Grande Sertão: Veredas',
      autor: 'João Guimarães Rosa',
      isbn: '9788535911916',
      ano: 1956,
      editora: 'José Olympio',
      categoria: 'Regionalismo',
      numeroPaginas: 624,
      capa: 'grande-sertao.svg',
      sinopse: 'Riobaldo narra sua travessia pelo sertão, o pacto, o amor e a pergunta que atravessa o livro: o diabo existe?',
      exemplares: { create: [{ codigo: 'EX-0004' }, { codigo: 'EX-0005' }] },
    },
  })

  await prisma.livro.create({
    data: {
      titulo: 'A Hora da Estrela',
      autor: 'Clarice Lispector',
      isbn: '9788532508584',
      ano: 1977,
      editora: 'Rocco',
      categoria: 'Conto',
      numeroPaginas: 88,
      capa: 'hora-da-estrela.svg',
      sinopse: 'Macabéa chega do Nordeste ao Rio e atravessa a cidade quase invisível. Uma história breve, seca e luminosa.',
      exemplares: { create: [{ codigo: 'EX-0006' }, { codigo: 'EX-0007' }, { codigo: 'EX-0008' }] },
    },
  })

  await prisma.livro.create({
    data: {
      titulo: 'Capitães da Areia',
      autor: 'Jorge Amado',
      isbn: '9788535914061',
      ano: 1937,
      editora: 'Companhia das Letras',
      categoria: 'Romance',
      numeroPaginas: 280,
      capa: 'capitaes.svg',
      sinopse: 'Um bando de meninos de rua vive o cais de Salvador. Aventura, abandono e a cidade vista de baixo.',
      exemplares: { create: [{ codigo: 'EX-0009' }] },
    },
  })

  console.log('Banco semeado com o catálogo.')
  console.log(`Bibliotecária: ${carla.nome}`)
}

main()
  .catch((erro) => {
    console.error(erro)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
