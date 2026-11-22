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
