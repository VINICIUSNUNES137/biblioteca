'use client'

import { useEffect, useState } from 'react'
import { del, get, post, put } from '@/lib/api'
import { usarUsuario } from '@/lib/usuario'
import Aviso from '@/components/Aviso'
import Avatar from '@/components/Avatar'
import Botao from '@/components/Botao'
import CabecalhoPagina from '@/components/CabecalhoPagina'
import Campo from '@/components/Campo'
import EmptyState, { ArtePessoas } from '@/components/EmptyState'
import Lozenge from '@/components/Lozenge'
import Modal from '@/components/Modal'
import Tabela from '@/components/Tabela'

const FORMULARIO_VAZIO = { nome: '', email: '', perfil: 'LEITOR' }

export default function PaginaUsuarios() {
  const { usuario, recarregar } = usarUsuario()
  const [lista, setLista] = useState([])
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)

  async function carregar() {
    setLista(await get('/usuarios'))
  }

  useEffect(() => {
    if (!usuario) return
    carregar().catch((e) => setErro(e.message))
  }, [usuario])

  function abrirNovo() {
    setFormulario(FORMULARIO_VAZIO)
    setModal({ tipo: 'novo' })
  }

  function abrirEdicao(item) {
    setFormulario({ nome: item.nome, email: item.email, perfil: item.perfil })
    setModal({ tipo: 'editar', id: item.id })
  }

  async function salvar() {
    setErro('')
    try {
      if (modal.tipo === 'novo') await post('/usuarios', formulario)
      else await put(`/usuarios/${modal.id}`, formulario)
      setModal(null)
      await carregar()
      await recarregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  async function excluir(id) {
    setErro('')
    try {
      await del(`/usuarios/${id}`)
      await carregar()
      await recarregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Cadastre leitores para registrar empréstimos e reservas. O sistema é usado só pelo bibliotecário."
        acoes={<Botao onClick={abrirNovo}>Novo usuário</Botao>}
      />

      {!modal && (
        <Aviso tipo="erro" aoFechar={() => setErro('')}>
          {erro}
        </Aviso>
      )}

      <div className="cartao" style={{ padding: 0 }}>
        <Tabela
          colunas={[
            {
              chave: 'nome',
              titulo: 'Nome',
              render: (linha) => (
                <div className="celula-livro">
                  <Avatar nome={linha.nome} />
                  <span>{linha.nome}</span>
                </div>
              ),
            },
            { chave: 'email', titulo: 'E-mail' },
            {
              chave: 'perfil',
              titulo: 'Perfil',
              render: (linha) => <Lozenge situacao={linha.perfil} />,
            },
            {
              chave: 'acoes',
              titulo: '',
              render: (linha) => (
                <div className="acoes">
                  <Botao variante="sutil" onClick={() => abrirEdicao(linha)}>
                    Editar
                  </Botao>
                  <Botao variante="perigo" onClick={() => excluir(linha.id)}>
                    Excluir
                  </Botao>
                </div>
              ),
            },
          ]}
          linhas={lista}
          vazio={
            <EmptyState
              ilustracao={<ArtePessoas />}
              titulo="Nenhum usuário cadastrado"
              descricao="Cadastre leitores para emprestar e acompanhar o acervo."
              acao={<Botao onClick={abrirNovo}>Novo usuário</Botao>}
            />
          }
        />
      </div>

      <Modal
        aberto={Boolean(modal)}
        titulo={modal?.tipo === 'novo' ? 'Novo usuário' : 'Editar usuário'}
        descricao="Leitor é quem leva o livro. Bibliotecário opera o sistema."
        aoFechar={() => setModal(null)}
        rodape={
          <>
            <Botao variante="sutil" onClick={() => setModal(null)}>
              Cancelar
            </Botao>
            <Botao onClick={salvar}>Salvar</Botao>
          </>
        }
      >
        <Aviso tipo="erro">{erro}</Aviso>
        <Campo
          rotulo="Nome"
          value={formulario.nome}
          onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
        />
        <Campo
          rotulo="E-mail"
          type="email"
          value={formulario.email}
          onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
        />
        <Campo
          as="select"
          rotulo="Perfil"
          value={formulario.perfil}
          onChange={(e) => setFormulario({ ...formulario, perfil: e.target.value })}
        >
          <option value="LEITOR">Leitor</option>
          <option value="BIBLIOTECARIO">Bibliotecário</option>
        </Campo>
      </Modal>
    </>
  )
}
