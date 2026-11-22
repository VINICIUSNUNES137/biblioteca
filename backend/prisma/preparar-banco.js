require('dotenv').config()

const fs = require('node:fs')
const path = require('node:path')

// No Windows, o motor do Prisma pode falhar ao criar o arquivo SQLite.
if (process.env.DATABASE_URL === 'file:./dev.db') {
  const arquivo = path.join(__dirname, 'dev.db')
  try {
    fs.closeSync(fs.openSync(arquivo, 'wx'))
  } catch (erro) {
    if (erro.code !== 'EEXIST') throw erro
  }
}
