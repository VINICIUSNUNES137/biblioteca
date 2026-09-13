'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { get } from './api'

const ContextoUsuario = createContext(null)

export function ProvedorUsuario({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  async function carregarUsuarios() {
    const lista = await get('/usuarios')
    setUsuarios(lista)
    const operador = lista.find((item) => item.perfil === 'BIBLIOTECARIO') || lista[0] || null
    if (operador) {
      setUsuario(operador)
      localStorage.setItem('usuarioId', String(operador.id))
    }
    return lista
  }

  useEffect(() => {
    carregarUsuarios()
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false))
  }, [])

  return (
    <ContextoUsuario.Provider value={{ usuario, usuarios, carregando, erro, recarregar: carregarUsuarios }}>
      {children}
    </ContextoUsuario.Provider>
  )
}

export function usarUsuario() {
  return useContext(ContextoUsuario)
}
