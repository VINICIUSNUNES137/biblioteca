import Aviso from '@/components/Aviso'
import Botao from '@/components/Botao'
import Campo from '@/components/Campo'
import Modal from '@/components/Modal'
import { paraInputData } from '@/lib/formatar'

export default function ModalDevolucao({
  aberto,
  emprestimo,
  data,
  setData,
  erro,
  aoFechar,
  aoConfirmar,
}) {
  const hoje = paraInputData(new Date())
  const minimo = emprestimo?.emprestadoEm ? paraInputData(emprestimo.emprestadoEm) : undefined

  return (
    <Modal
      aberto={aberto}
      titulo="Registrar devolução"
      descricao={
        emprestimo
          ? `Exemplar ${emprestimo.codigo}. A multa é calculada com a data informada contra o prazo.`
          : 'Informe o dia em que o exemplar voltou.'
      }
      aoFechar={aoFechar}
      rodape={
        <>
          <Botao variante="sutil" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao onClick={aoConfirmar} disabled={!data}>
            Confirmar devolução
          </Botao>
        </>
      }
    >
      <Aviso tipo="erro">{erro}</Aviso>
      {emprestimo?.leitorNome && (
        <p style={{ marginTop: 0, color: 'var(--ds-text-subtle)' }}>Leitor: {emprestimo.leitorNome}</p>
      )}
      <Campo
        type="date"
        rotulo="Data da devolução"
        value={data}
        min={minimo}
        max={hoje}
        onChange={(e) => setData(e.target.value)}
        ajuda="Hoje já vem marcado. Altere se o livro voltou em outro dia."
      />
    </Modal>
  )
}
