'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { get } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import Aviso from '@/components/Aviso'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import CapaLivro from '@/components/CapaLivro'
import EmptyState, { ArteEmprestimo, ArteFila, ArtePessoas } from '@/components/EmptyState'
import Tabela from '@/components/Tabela'

export default function PaginaPainel() {
  const { usuario } = usarUsuario()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!usuario) return
    get('/painel/resumo')
      .then(setDados)
      .catch((e) => setErro(e.message))
  }, [usuario])

  if (!dados) {
    return erro ? <Aviso tipo="erro">{erro}</Aviso> : <p>Carregando…</p>
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Painel"
        descricao={`Números do acervo em movimento. Multa: R$ ${dados.valorDiaMulta.toFixed(2)} por dia de atraso.`}
      />

      <Aviso tipo="erro" aoFechar={() => setErro('')}>
        {erro}
      </Aviso>

      <div className="metricas">
        <div className="metrica">
          <span>Emprestados agora</span>
          <strong>{dados.emprestadosAgora}</strong>
        </div>
        <div className="metrica">
          <span>Em atraso</span>
          <strong>{dados.emAtraso}</strong>
        </div>
        <div className="metrica">
          <span>Tempo médio (dias)</span>
          <strong>{dados.tempoMedioDias}</strong>
        </div>
        <div className="metrica">
          <span>Na fila</span>
          <strong>{dados.filaTotal}</strong>
        </div>
      </div>

      <div className="grade-2">
        <div className="cartao" style={{ padding: 0 }}>
          <h2 style={{ padding: '16px 16px 0', margin: 0 }}>Livros mais emprestados</h2>
          <Tabela
            colunas={[
              {
                chave: 'livro',
                titulo: 'Título',
                render: (linha) => (
                  <Link href={`/livros/${linha.livro.id}`} className="celula-livro">
                    <CapaLivro capa={linha.livro.capa} titulo={linha.livro.titulo} tamanho="mini" />
                    <span>{linha.livro.titulo}</span>
                  </Link>
                ),
              },
              { chave: 'total', titulo: 'Empréstimos' },
            ]}
            linhas={dados.livrosMaisEmprestados}
            vazio={
              <EmptyState
                ilustracao={<ArteEmprestimo />}
                titulo="Ainda não há empréstimos"
                descricao="Quando o acervo circular, os títulos mais pedidos aparecem aqui."
              />
            }
          />
        </div>
        <div className="cartao" style={{ padding: 0 }}>
          <h2 style={{ padding: '16px 16px 0', margin: 0 }}>Leitores bloqueados</h2>
          <Tabela
            colunas={[
              { chave: 'nome', titulo: 'Leitor', render: (linha) => linha.usuario.nome },
              { chave: 'atrasos', titulo: 'Atrasos' },
            ]}
            linhas={dados.leitoresBloqueados}
            vazio={
              <EmptyState
                ilustracao={<ArtePessoas />}
                titulo="Nenhum leitor bloqueado"
                descricao="O bloqueio aparece sozinho quando há empréstimo vencido em aberto."
              />
            }
          />
        </div>
      </div>

      <div className="cartao" style={{ padding: 0, marginTop: 16 }}>
        <h2 style={{ padding: '16px 16px 0', margin: 0 }}>Fila de reservas</h2>
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
            { chave: 'aguardando', titulo: 'Aguardando' },
          ]}
          linhas={dados.filaReservas}
          vazio={
            <EmptyState
              ilustracao={<ArteFila />}
              titulo="Nenhuma reserva aguardando"
              descricao="A fila só existe quando um título está inteiro emprestado."
            />
          }
        />
      </div>
    </>
  )
}
