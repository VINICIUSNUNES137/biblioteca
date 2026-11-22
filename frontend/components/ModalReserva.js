'use client'

import { useEffect, useState } from 'react'
import { get, post } from '@/lib/api'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CapaLivro from '@/components/CapaLivro'
import { BuscaEscolha, GradeEscolhaLivros, LivroSelecionado, OpcoesLeitores, correspondeBusca } from '@/components/EscolhasCirculacao'
import Modal from '@/components/Modal'

export default function ModalReserva({ livroInicial = null, leitores, aoFechar, aoReservar }) {
  const [livros, setLivros] = useState(null)
  const [livro, setLivro] = useState(livroInicial)
  const [buscaLivro, setBuscaLivro] = useState('')
  const [buscaLeitor, setBuscaLeitor] = useState('')
  const [leitorId, setLeitorId] = useState(null)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (livroInicial) return
    let ativo = true
    get('/livros')
      .then((catalogo) => {
        if (ativo) setLivros(catalogo.filter((item) => item.disponiveis === 0 && item.totalExemplares > 0))
      })
      .catch((e) => {
        if (ativo) setErro(e.message)
      })
    return () => { ativo = false }
  }, [livroInicial])

  const livrosVisiveis = livros?.filter((item) => correspondeBusca(buscaLivro, item.titulo, item.autor))
  const leitoresVisiveis = leitores.filter((item) => correspondeBusca(buscaLeitor, item.nome))
  const leitor = leitores.find((item) => item.id === leitorId)

  function trocarLivro() {
    setLivro(null)
    setLeitorId(null)
    setBuscaLeitor('')
    setErro('')
  }

  function fechar() {
    if (!salvando) aoFechar()
  }

  async function reservar() {
    setSalvando(true)
    setErro('')
    let reserva
    try {
      reserva = await post('/reservas', { livroId: livro.id, leitorId: leitor.id })
    } catch (e) {
      setErro(e.message)
      setSalvando(false)
      return
    }
    aoReservar(reserva)
  }

  return (
    <Modal
      aberto
      tamanho="grande"
      titulo={livro ? 'Quem entra na fila?' : 'Qual livro você quer reservar?'}
      descricao={livro
        ? 'Escolha o leitor para adicionar à fila de espera.'
        : 'Só aparecem títulos sem exemplar disponível.'}
      aoFechar={fechar}
      rodape={
        <>
          {livro && !livroInicial ? (
            <Botao variante="sutil" onClick={trocarLivro} disabled={salvando}>Trocar livro</Botao>
          ) : (
            <Botao variante="sutil" onClick={fechar} disabled={salvando}>Cancelar</Botao>
          )}
          {livro && (
            <Botao onClick={reservar} disabled={!leitor || salvando}>
              {salvando ? 'Confirmando…' : 'Confirmar reserva'}
            </Botao>
          )}
        </>
      }
    >
      {!livroInicial && (
        <div className="passos">
          <span className={livro ? 'is-feito' : 'is-atual'} aria-current={!livro ? 'step' : undefined}>1. Livro</span>
          <span className={livro ? 'is-atual' : ''} aria-current={livro ? 'step' : undefined}>2. Leitor</span>
        </div>
      )}

      <div role="status"><Aviso tipo="erro">{erro}</Aviso></div>

      {livro ? (
        <div className="painel-escolha painel-escolha--reserva">
          <LivroSelecionado livro={livro} />
          <div>
            {leitores.length > 0 && (
              <BuscaEscolha
                rotulo="Buscar leitor"
                placeholder="Buscar leitor por nome"
                valor={buscaLeitor}
                aoMudar={setBuscaLeitor}
                foco
              />
            )}
            {leitoresVisiveis.length > 0 ? (
              <OpcoesLeitores
                leitores={leitoresVisiveis}
                selecionado={leitorId}
                aoEscolher={(id) => {
                  setLeitorId(id)
                  setErro('')
                }}
                desabilitado={salvando}
              />
            ) : (
              <p className="escolha-status" role="status">
                {leitores.length === 0 ? 'Cadastre um leitor para criar uma reserva.' : 'Nenhum leitor encontrado.'}
              </p>
            )}
            {leitor && (
              <p className="resumo-escolha">
                <CapaLivro capa={livro.capa} titulo={livro.titulo} tamanho="mini" />
                <span><strong>{leitor.nome}</strong> entra na fila de <strong>{livro.titulo}</strong>.</span>
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {livros?.length > 0 && (
            <BuscaEscolha
              rotulo="Buscar livro para reservar"
              placeholder="Buscar por título ou autor"
              valor={buscaLivro}
              aoMudar={setBuscaLivro}
              foco
            />
          )}
          {livrosVisiveis?.length > 0 && <GradeEscolhaLivros livros={livrosVisiveis} aoEscolher={setLivro} />}
          {!livros && !erro && <p className="escolha-status" role="status">Carregando o acervo…</p>}
          {livrosVisiveis?.length === 0 && (
            <p className="escolha-status" role="status">
              {livros.length === 0 ? 'Nenhum título está elegível para reserva agora.' : 'Nenhum título encontrado para essa busca.'}
            </p>
          )}
        </>
      )}
    </Modal>
  )
}
