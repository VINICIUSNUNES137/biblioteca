const MAPA = {
  DISPONIVEL: { texto: 'Disponível', tom: 'verde' },
  EMPRESTADO: { texto: 'Emprestado', tom: 'amarelo' },
  RESERVADO: { texto: 'Reservado', tom: 'azul' },
  ATRASADO: { texto: 'Atrasado', tom: 'vermelho' },
  INDISPONIVEL: { texto: 'Indisponível', tom: 'cinza' },
  AGUARDANDO: { texto: 'Aguardando', tom: 'azul' },
  ATENDIDA: { texto: 'Atendida', tom: 'verde' },
  CANCELADA: { texto: 'Cancelada', tom: 'cinza' },
  DEVOLVIDO: { texto: 'Devolvido', tom: 'cinza' },
  EMPRESTIMO: { texto: 'Empréstimo', tom: 'amarelo' },
  DEVOLUCAO: { texto: 'Devolução', tom: 'verde' },
  RESERVA: { texto: 'Reserva', tom: 'azul' },
  RESERVA_ATENDIDA: { texto: 'Fila atendida', tom: 'verde' },
  RESERVA_CANCELADA: { texto: 'Reserva cancelada', tom: 'cinza' },
  LEITOR: { texto: 'Leitor', tom: 'azul' },
  BIBLIOTECARIO: { texto: 'Bibliotecário', tom: 'verde' },
}

export default function Lozenge({ situacao, children }) {
  const item = MAPA[situacao] || { texto: situacao || children, tom: 'cinza' }
  return <span className={`lozenge lozenge--${item.tom}`}>{children || item.texto}</span>
}
