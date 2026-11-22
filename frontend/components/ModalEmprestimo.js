'use client'

import { useEffect, useState } from 'react'
import { get } from '@/lib/api'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CapaLivro from '@/components/CapaLivro'
import { BuscaEscolha, GradeEscolhaLivros, LivroSelecionado, OpcoesLeitores, correspondeBusca } from '@/components/EscolhasCirculacao'
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
  const [leitorId, setLeitorId] = useState(null)

  useEffect(() => {
    if (!aberto) return
    setBusca('')
    setLivro(null)
    setExemplares([])
    setExemplarId('')
    setLeitorId(null)
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

  const visiveis = livros.filter((item) => correspondeBusca(busca, item.titulo, item.autor))

  const leitor = leitores.find((item) => item.id === leitorId)
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
              onClick={() => aoConfirmar({ exemplarId: Number(exemplarId), leitorId, livro })}
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
          <BuscaEscolha
            rotulo="Buscar livro para emprestar"
            placeholder="Buscar por título ou autor"
            valor={busca}
            aoMudar={setBusca}
          />

          {carregando && <p className="escolha-status">Carregando o acervo…</p>}

          {consultou && !carregando && visiveis.length === 0 && (
            <p className="escolha-status">
              {livros.length === 0
                ? 'Nenhum exemplar está livre no momento.'
                : 'Nenhum título encontrado para essa busca.'}
            </p>
          )}

          <GradeEscolhaLivros
            livros={visiveis}
            aoEscolher={escolherLivro}
            rotuloDisponibilidade={(item) => `${item.disponiveis} ${item.disponiveis === 1 ? 'cópia livre' : 'cópias livres'}`}
          />
        </>
      )}

      {livro && (
        <div className="painel-escolha">
          <LivroSelecionado livro={livro} />

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
            <OpcoesLeitores leitores={leitores} selecionado={leitorId} aoEscolher={setLeitorId} />

            {livro && exemplar && leitor && (
              <p className="resumo-escolha">
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
