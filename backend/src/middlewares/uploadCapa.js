const path = require('path')
const fs = require('fs')
const multer = require('multer')
const ErroDeNegocio = require('../erros/ErroDeNegocio')

const pastaCapas = path.join(__dirname, '../../uploads/capas')
fs.mkdirSync(pastaCapas, { recursive: true })

const armazenamento = multer.diskStorage({
  destination: pastaCapas,
  filename: (req, arquivo, done) => {
    const extensao = path.extname(arquivo.originalname).toLowerCase() || '.jpg'
    done(null, `livro-${req.params.id}-${Date.now()}${extensao}`)
  },
})

const envio = multer({
  storage: armazenamento,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, arquivo, done) => {
    const tipos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!tipos.includes(arquivo.mimetype)) {
      return done(new ErroDeNegocio('ARQUIVO_INVALIDO', 'Envie uma imagem JPG, PNG, WEBP ou SVG.', 400))
    }
    done(null, true)
  },
})

function receberCapa(req, res, next) {
  envio.single('capa')(req, res, (erro) => {
    if (!erro) return next()
    if (erro instanceof ErroDeNegocio) return next(erro)
    if (erro.code === 'LIMIT_FILE_SIZE') {
      return next(new ErroDeNegocio('ARQUIVO_GRANDE', 'A capa deve ter no máximo 2 MB.', 400))
    }
    next(new ErroDeNegocio('ARQUIVO_INVALIDO', erro.message || 'Não foi possível enviar a capa.', 400))
  })
}

module.exports = { receberCapa, pastaCapas }
