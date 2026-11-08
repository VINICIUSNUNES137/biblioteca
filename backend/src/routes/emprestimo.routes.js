const { Router } = require('express')
const controller = require('../controllers/emprestimo.controller')
const identificarUsuario = require('../middlewares/identificarUsuario')
const exigirPerfil = require('../middlewares/exigirPerfil')
const assincrono = require('../util/assincrono')

const rotas = Router()

rotas.get('/emprestimos', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.listar))
rotas.post('/emprestimos', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.criar))
rotas.post('/emprestimos/:id/devolver', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.devolver))

module.exports = rotas
