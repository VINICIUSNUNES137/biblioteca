BEGIN;

-- Antes do vínculo explícito, a devolução gravava a mesma data na reserva e no histórico.
-- Atualiza apenas pares com uma única correspondência de cada lado.
WITH correspondencias AS (
  SELECT
    m.id AS movimentacaoId,
    r.id AS reservaId,
    COUNT(*) OVER (PARTITION BY m.id) AS reservasEncontradas,
    COUNT(*) OVER (PARTITION BY r.id) AS movimentacoesEncontradas
  FROM movimentacao m
  JOIN reserva r
    ON r.livroId = m.livroId
   AND r.leitorId = m.leitorId
   AND r.atendidaEm = m.data
  WHERE m.tipo = 'RESERVA_ATENDIDA'
    AND r.situacao = 'ATENDIDA'
), vinculos AS (
  SELECT movimentacaoId, reservaId
  FROM correspondencias
  WHERE reservasEncontradas = 1 AND movimentacoesEncontradas = 1
)
UPDATE movimentacao
SET reservaId = (SELECT v.reservaId FROM vinculos v WHERE v.movimentacaoId = movimentacao.id)
WHERE reservaId IS NULL
  AND id IN (SELECT movimentacaoId FROM vinculos);

-- Uma separação antiga continua pendente se ainda for a última daquele exemplar
-- reservado e nenhum empréstimo tiver consumido a reserva.
UPDATE reserva
SET situacao = 'PRONTA_PARA_RETIRADA', atendidaEm = NULL
WHERE situacao = 'ATENDIDA'
  AND NOT EXISTS (SELECT 1 FROM emprestimo e WHERE e.reservaId = reserva.id)
  AND EXISTS (
    SELECT 1 FROM movimentacao m
    JOIN exemplar x ON x.id = m.exemplarId
    WHERE m.reservaId = reserva.id AND m.tipo = 'RESERVA_ATENDIDA'
      AND x.situacao = 'RESERVADO'
      AND NOT EXISTS (
        SELECT 1 FROM movimentacao posterior
        WHERE posterior.exemplarId = x.id
          AND posterior.tipo IN ('RESERVA_ATENDIDA', 'RESERVA_SEPARADA')
          AND posterior.id > m.id
      )
  );

UPDATE movimentacao SET tipo = 'RESERVA_SEPARADA' WHERE tipo = 'RESERVA_ATENDIDA';

UPDATE reserva
SET atendidaEm = (SELECT e.emprestadoEm FROM emprestimo e WHERE e.reservaId = reserva.id)
WHERE situacao = 'ATENDIDA'
  AND EXISTS (SELECT 1 FROM emprestimo e WHERE e.reservaId = reserva.id);

COMMIT;
