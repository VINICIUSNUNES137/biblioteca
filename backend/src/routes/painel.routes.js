const { Router } = require('express')
const controller = require('../controllers/painel.controller')
const identificarUsuario = require('../middlewares/identificarUsuario')
const exigirPerfil = require('../middlewares/exigirPerfil')
const assincrono = require('../util/assincrono')

const rotas = Router()

rotas.get('/painel/resumo', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.resumo))

module.exports = rotas
