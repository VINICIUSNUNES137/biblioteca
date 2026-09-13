'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { enviarArquivo, get, post } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { FORMULARIO_LIVRO_VAZIO } from '@/lib/livro'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteBusca, ArteLivros } from '@/components/EmptyState'
import FormularioLivro from '@/components/FormularioLivro'
import Lozenge from '@/components/Lozenge'
import Modal from '@/components/Modal'

export default function PaginaLivros() {
  const { usuario } = usarUsuario()
  const [livros, setLivros] = useState([])
  const [busca, setBusca] = useState('')
  const [buscaDebounce, setBuscaDebounce] = useState('')
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [formulario, setFormulario] = useState(FORMULARIO_LIVRO_VAZIO)
  const [arquivoCapa, setArquivoCapa] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [carregou, setCarregou] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounce(busca), 300)
    return () => clearTimeout(t)
  }, [busca])

  async function carregar() {
    const query = buscaDebounce ? `?busca=${encodeURIComponent(buscaDebounce)}` : ''
    setLivros(await get(`/livros${query}`))
    setCarregou(true)
  }

  useEffect(() => {
    if (!usuario) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario, buscaDebounce])

  async function criarLivro() {
    setSalvando(true)
    setErro('')
    try {
      const criado = await post('/livros', {
        ...formulario,
        ano: Number(formulario.ano),
        numeroPaginas: formulario.numeroPaginas ? Number(formulario.numeroPaginas) : null,
      })
      if (arquivoCapa) await enviarArquivo(`/livros/${criado.id}/capa`, arquivoCapa)
      setModalAberto(false)
      setFormulario(FORMULARIO_LIVRO_VAZIO)
      setArquivoCapa(null)
      await carregar()
    } catch (e) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Catálogo"
        descricao="Títulos do acervo, capas e disponibilidade das cópias físicas."
        acoes={<Botao onClick={() => setModalAberto(true)}>Novo livro</Botao>}
      />

      {!modalAberto && (
        <Aviso tipo="erro" aoFechar={() => setErro('')}>
          {erro}
        </Aviso>
      )}

      <div className="toolbar">
        <div className="busca">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Buscar por título, autor, editora ou ISBN"
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label="Buscar livros"
          />
        </div>
      </div>

      {carregou && livros.length === 0 && buscaDebounce && (
        <div className="cartao">
          <EmptyState
            ilustracao={<ArteBusca />}
            titulo="Nenhum resultado"
            descricao={`Não encontramos nada para “${buscaDebounce}”. Tente outro título, autor ou ISBN.`}
          />
        </div>
      )}

      {carregou && livros.length === 0 && !buscaDebounce && (
        <div className="cartao">
          <EmptyState
            ilustracao={<ArteLivros />}
            titulo="O acervo ainda está vazio"
            descricao="Cadastre o primeiro título e as cópias físicas para o catálogo aparecer aqui."
            acao={<Botao onClick={() => setModalAberto(true)}>Cadastrar livro</Botao>}
          />
        </div>
      )}

      {livros.length > 0 && (
        <div className="grade-livros">
          {livros.map((livro) => (
            <Link key={livro.id} href={`/livros/${livro.id}`} className="cartao-livro">
              <CapaLivro capa={livro.capa} titulo={livro.titulo} />
              <div className="cartao-livro__corpo">
                <h3>{livro.titulo}</h3>
                <p>{livro.autor}</p>
                <div className="cartao-livro__meta">
                  {livro.disponiveis > 0 ? (
                    <Lozenge situacao="DISPONIVEL">{livro.disponiveis} disp.</Lozenge>
                  ) : (
                    <Lozenge situacao="EMPRESTADO">Indisponível</Lozenge>
                  )}
                  <span>{livro.totalExemplares} ex.</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        aberto={modalAberto}
        tamanho="grande"
        titulo="Cadastrar livro"
        descricao="Informe o título e envie a capa. Exemplares físicos são adicionados depois, na página do livro."
        aoFechar={() => setModalAberto(false)}
        rodape={
          <>
            <Botao variante="sutil" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao onClick={criarLivro} disabled={salvando}>
              Cadastrar
            </Botao>
          </>
        }
      >
        <Aviso tipo="erro" aoFechar={() => setErro('')}>
          {erro}
        </Aviso>
        <FormularioLivro
          formulario={formulario}
          setFormulario={setFormulario}
          arquivoCapa={arquivoCapa}
          setArquivoCapa={setArquivoCapa}
        />
      </Modal>
    </>
  )
}
