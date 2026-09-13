const { Router } = require('express')
const controller = require('../controllers/reserva.controller')
const identificarUsuario = require('../middlewares/identificarUsuario')
const exigirPerfil = require('../middlewares/exigirPerfil')
const assincrono = require('../util/assincrono')

const rotas = Router()

rotas.get('/reservas', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.listar))
rotas.post('/reservas', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.criar))
rotas.delete('/reservas/:id', identificarUsuario, exigirPerfil('BIBLIOTECARIO'), assincrono(controller.cancelar))

module.exports = rotas
