'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { del, get, post } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import { formatarData } from '@/lib/formatar'
import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import Campo from '@/components/Campo'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteFila } from '@/components/EmptyState'
import Lozenge from '@/components/Lozenge'
import Modal from '@/components/Modal'
import Tabela from '@/components/Tabela'

export default function PaginaReservas() {
  const { usuario, usuarios } = usarUsuario()
  const [lista, setLista] = useState([])
  const [livros, setLivros] = useState([])
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [somenteAguardando, setSomenteAguardando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [livroId, setLivroId] = useState('')
  const [leitorId, setLeitorId] = useState('')

  const leitores = (usuarios || []).filter((item) => item.perfil === 'LEITOR')
  const livrosEsgotados = livros.filter((item) => item.disponiveis === 0 && item.totalExemplares > 0)

  async function carregar() {
    const query = somenteAguardando ? '?situacao=AGUARDANDO' : ''
    const [reservas, acervo] = await Promise.all([get(`/reservas${query}`), get('/livros')])
    setLista(reservas)
    setLivros(acervo)
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

  async function reservar() {
    setErro('')
    try {
      const reserva = await post('/reservas', { livroId: Number(livroId), leitorId: Number(leitorId) })
      setModalAberto(false)
      setLivroId('')
      setLeitorId('')
      setSucesso(`${reserva.leitor.nome} entrou na fila de ${reserva.livro.titulo}: ${reserva.posicao}º lugar.`)
      await carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Reservas"
        descricao="Fila de espera dos títulos esgotados. A posição é calculada na leitura, nunca gravada no banco."
        acoes={
          <>
            <label className="interruptor">
              <input
                type="checkbox"
                checked={somenteAguardando}
                onChange={(e) => setSomenteAguardando(e.target.checked)}
              />
              Somente aguardando
            </label>
            <Botao onClick={() => setModalAberto(true)}>Colocar na fila</Botao>
          </>
        }
      />

      {!modalAberto && (
        <>
          <Aviso tipo="erro" aoFechar={() => setErro('')}>
            {erro}
          </Aviso>
          <Aviso tipo="sucesso" aoFechar={() => setSucesso('')}>
            {sucesso}
          </Aviso>
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
              acao={<Botao onClick={() => setModalAberto(true)}>Colocar na fila</Botao>}
            />
          }
        />
      </div>

      <Modal
        aberto={modalAberto}
        titulo="Colocar leitor na fila"
        descricao="Só é possível reservar títulos sem exemplar disponível."
        aoFechar={() => setModalAberto(false)}
        rodape={
          <>
            <Botao variante="sutil" onClick={() => setModalAberto(false)}>
              Cancelar
            </Botao>
            <Botao onClick={reservar} disabled={!livroId || !leitorId}>
              Confirmar reserva
            </Botao>
          </>
        }
      >
        <Aviso tipo="erro">{erro}</Aviso>
        <Campo as="select" rotulo="Livro" value={livroId} onChange={(e) => setLivroId(e.target.value)}>
          <option value="">Selecione o título</option>
          {livrosEsgotados.map((item) => (
            <option key={item.id} value={item.id}>
              {item.titulo}
            </option>
          ))}
        </Campo>
        <Campo as="select" rotulo="Leitor" value={leitorId} onChange={(e) => setLeitorId(e.target.value)}>
          <option value="">Selecione quem entra na fila</option>
          {leitores.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </Campo>
      </Modal>
    </>
  )
}
