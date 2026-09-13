const { Router } = require('express')
const controller = require('../controllers/usuario.controller')
const identificarUsuario = require('../middlewares/identificarUsuario')
const exigirPerfil = require('../middlewares/exigirPerfil')
const assincrono = require('../util/assincrono')

const rotas = Router()

rotas.get('/usuarios', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.listar))

module.exports = rotas
