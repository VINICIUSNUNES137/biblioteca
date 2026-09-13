const { Router } = require('express')
const controller = require('../controllers/usuario.controller')
const identificarUsuario = require('../middlewares/identificarUsuario')
const exigirPerfil = require('../middlewares/exigirPerfil')
const assincrono = require('../util/assincrono')

const rotas = Router()

rotas.get('/usuarios', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.listar))
rotas.get('/usuarios/:id', identificarUsuario, assincrono(controller.buscar))
rotas.post('/usuarios', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.criar))
rotas.put('/usuarios/:id', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.atualizar))
rotas.delete('/usuarios/:id', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.excluir))

module.exports = rotas
