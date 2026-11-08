'use client'

import { useEffect, useState } from 'react'
import { get } from '@/lib/api'
import Aviso from '@/components/Aviso'
import Avatar from '@/components/Avatar'
import Botao from '@/components/Botao'
import CapaLivro from '@/components/CapaLivro'
import Modal from '@/components/Modal'

export default function ModalEmprestimo({ aberto, leitores, erro, aoFechar, aoConfirmar }) {
  const [livros, setLivros] = useState([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [consultou, setConsultou] = useState(false)
  const [erroLocal, setErroLocal] = useState('')
  const [livro, setLivro] = useState(null)
  const [exemplares, setExemplares] = useState([])
  const [exemplarId, setExemplarId] = useState('')
  const [leitorId, setLeitorId] = useState('')

  useEffect(() => {
    if (!aberto) return
    setBusca('')
    setLivro(null)
    setExemplares([])
    setExemplarId('')
    setLeitorId('')
    setErroLocal('')
    setConsultou(false)
    setCarregando(true)
    get('/livros')
      .then((catalogo) => setLivros(catalogo.filter((item) => item.disponiveis > 0)))
      .catch((e) => setErroLocal(e.message))
      .finally(() => {
        setCarregando(false)
        setConsultou(true)
      })
  }, [aberto])

  async function escolherLivro(item) {
    setErroLocal('')
    setLivro(item)
    setExemplarId('')
    setExemplares([])
    setCarregando(true)
    try {
      const detalhe = await get(`/livros/${item.id}`)
      const livres = detalhe.exemplares.filter((copia) => copia.situacao === 'DISPONIVEL')
      setExemplares(livres)
      if (livres.length === 1) setExemplarId(String(livres[0].id))
    } catch (e) {
      setErroLocal(e.message)
    } finally {
      setCarregando(false)
    }
  }

  const termo = busca.trim().toLowerCase()
  const visiveis = livros.filter((item) => {
    if (!termo) return true
    return item.titulo.toLowerCase().includes(termo) || item.autor.toLowerCase().includes(termo)
  })

  const leitor = leitores.find((item) => String(item.id) === String(leitorId))
  const exemplar = exemplares.find((item) => String(item.id) === String(exemplarId))

  return (
    <Modal
      aberto={aberto}
      tamanho="grande"
      titulo={livro ? 'Confirmar saída' : 'Qual livro sai agora?'}
      descricao={
        livro
          ? 'Confira a capa, escolha a cópia e quem leva. O prazo de 14 dias é calculado pelo sistema.'
          : 'Toque na capa do título. Só aparecem livros com exemplar livre.'
      }
      aoFechar={aoFechar}
      rodape={
        livro ? (
          <>
            <Botao
              variante="sutil"
              onClick={() => {
                setLivro(null)
                setExemplarId('')
                setExemplares([])
              }}
            >
              Trocar livro
            </Botao>
            <Botao
              onClick={() => aoConfirmar({ exemplarId: Number(exemplarId), leitorId: Number(leitorId), livro })}
              disabled={!exemplarId || !leitorId || carregando}
            >
              Confirmar empréstimo
            </Botao>
          </>
        ) : (
          <Botao variante="sutil" onClick={aoFechar}>
            Cancelar
          </Botao>
        )
      }
    >
      <div className="passos" aria-hidden="true">
        <span className={livro ? 'is-feito' : 'is-atual'}>1. Livro</span>
        <span className={livro ? 'is-atual' : ''}>2. Cópia e leitor</span>
      </div>

      <Aviso tipo="erro">{erroLocal || erro}</Aviso>

      {!livro && (
        <>
          <div className="busca escolha-busca">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Buscar por título ou autor"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              aria-label="Buscar livro para emprestar"
            />
          </div>

          {carregando && <p className="escolha-status">Carregando o acervo…</p>}

          {consultou && !carregando && visiveis.length === 0 && (
            <p className="escolha-status">
              {livros.length === 0
                ? 'Nenhum exemplar está livre no momento.'
                : 'Nenhum título encontrado para essa busca.'}
            </p>
          )}

          <div className="grade-escolha">
            {visiveis.map((item) => (
              <button key={item.id} type="button" className="escolha-livro" onClick={() => escolherLivro(item)}>
                <CapaLivro capa={item.capa} titulo={item.titulo} tamanho="escolha" />
                <span className="escolha-livro__corpo">
                  <strong>{item.titulo}</strong>
                  <span>{item.autor}</span>
                  <em>
                    {item.disponiveis} {item.disponiveis === 1 ? 'cópia livre' : 'cópias livres'}
                  </em>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {livro && (
        <div className="painel-emprestimo">
          <div className="painel-emprestimo__livro">
            <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="escolha" />
            <strong>{livro.titulo}</strong>
            <span>{livro.autor}</span>
          </div>

          <div>
            <p className="escolha-rotulo">Cópia que sai</p>
            {carregando && <p className="escolha-status">Buscando exemplares…</p>}
            <div className="opcoes">
              {exemplares.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`opcao opcao-copia${String(exemplarId) === String(item.id) ? ' is-selecionado' : ''}`}
                  onClick={() => setExemplarId(String(item.id))}
                  aria-pressed={String(exemplarId) === String(item.id)}
                >
                  {item.codigo}
                </button>
              ))}
            </div>

            <p className="escolha-rotulo">Quem leva</p>
            <div className="opcoes">
              {leitores.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`opcao opcao-leitor${String(leitorId) === String(item.id) ? ' is-selecionado' : ''}`}
                  onClick={() => setLeitorId(String(item.id))}
                  aria-pressed={String(leitorId) === String(item.id)}
                >
                  <Avatar nome={item.nome} />
                  {item.nome}
                </button>
              ))}
            </div>

            {livro && exemplar && leitor && (
              <p className="resumo-saida">
                <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="mini" />
                <span>
                  <strong>{leitor.nome}</strong> leva <strong>{livro.titulo}</strong> ({exemplar.codigo}) por 14 dias.
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
