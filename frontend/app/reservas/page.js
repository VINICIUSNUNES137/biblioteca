'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { del, get } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { formatarData } from '@/lib/formatar'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteFila } from '@/components/EmptyState'
import Lozenge from '@/components/Lozenge'
import ModalReserva from '@/components/ModalReserva'
import Tabela from '@/components/Tabela'

export default function PaginaReservas() {
  const { usuario, usuarios } = usarUsuario()
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [somenteAguardando, setSomenteAguardando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)

  const leitores = (usuarios || []).filter((item) => item.perfil === 'LEITOR')

  async function carregar() {
    const query = somenteAguardando ? '?situacao=AGUARDANDO' : ''
    setLista(await get(`/reservas${query}`))
  }

  useEffect(() => {
    if (!usuario) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario, somenteAguardando])

  async function cancelar(id) {
    setErro('')
    try {
      await del(`/reservas/${id}`)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  function abrirReserva() {
    setErro('')
    setSucesso('')
    setModalAberto(true)
  }

  function reservaCriada(reserva) {
    setModalAberto(false)
    setSucesso(`${reserva.leitor.nome} entrou na fila de ${reserva.livro.titulo} em ${reserva.posicao}º lugar.`)
    carregar().catch((e) => setErro(e.message))
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Reservas"
        descricao="Acompanhe a fila de espera dos livros sem exemplar disponível."
        acoes={
          <>
            <Botao onClick={abrirReserva}>Colocar na fila</Botao>
            <label className="interruptor">
              <input
                type="checkbox"
                checked={somenteAguardando}
                onChange={(e) => setSomenteAguardando(e.target.checked)}
              />
              Somente aguardando
            </label>
          </>
        }
      />

      {!modalAberto && (
        <>
          <Aviso tipo="erro" aoFechar={() => setErro('')}>
            {erro}
          </Aviso>
          <div role="status">
            <Aviso tipo="sucesso" aoFechar={() => setSucesso('')}>{sucesso}</Aviso>
          </div>
        </>
      )}

      <div className="cartao" style={{ padding: 0 }}>
        <Tabela
          colunas={[
            {
              chave: 'livro',
              titulo: 'Livro',
              render: (linha) => (
                <Link href={`/livros/${linha.livro.id}`} className="celula-livro">
                  <CapaLivro capa={linha.livro.capa} titulo={linha.livro.titulo} tamanho="mini" />
                  <span>{linha.livro.titulo}</span>
                </Link>
              ),
            },
            { chave: 'leitor', titulo: 'Leitor', render: (linha) => linha.leitor.nome },
            {
              chave: 'posicao',
              titulo: 'Posição',
              render: (linha) => (linha.posicao ? `${linha.posicao}º` : '—'),
            },
            {
              chave: 'situacao',
              titulo: 'Situação',
              render: (linha) => <Lozenge situacao={linha.situacao} />,
            },
            { chave: 'criadoEm', titulo: 'Pedido em', render: (linha) => formatarData(linha.criadoEm) },
            {
              chave: 'acoes',
              titulo: '',
              render: (linha) =>
                linha.situacao === 'AGUARDANDO' ? (
                  <Botao variante="sutil" onClick={() => cancelar(linha.id)}>
                    Cancelar
                  </Botao>
                ) : null,
            },
          ]}
          linhas={lista}
          vazio={
            <EmptyState
              ilustracao={<ArteFila />}
              titulo="Nenhuma reserva na fila"
              descricao="Quando um título não tiver exemplar livre, coloque o leitor na espera aqui ou na página do livro."
              acao={<Botao onClick={abrirReserva}>Colocar na fila</Botao>}
            />
          }
        />
      </div>

      {modalAberto && (
        <ModalReserva leitores={leitores} aoFechar={() => setModalAberto(false)} aoReservar={reservaCriada} />
      )}
    </>
  )
}
