# Roteiro do vídeo (sem limite de tempo; sugestão ~12–15 min)

1. **Abertura (1 min):** tema, funcionalidade escolhida (monitor de sensores) e por que é bom exemplo de programação reativa/orientada a eventos.
2. **Conceitos de Programação Reativa (2 min):** streams, Observables, operadores, tratamento de erro, ciclo de vida de subscriptions (ligue aos slides da disciplina).
3. **Tour pelo harness (3–4 min):** `AGENTS.md` → `ARCHITECTURE.md` → `eslint.config.js` e `.dependency-cruiser.cjs` → `validate.sh`. Mostre uma violação proposital sendo barrada.
4. **Execução SEM harness (2–3 min):** prompt, resultado, intervenções. Pode acelerar trechos.
5. **Execução COM harness (2–3 min):** o agente rodando `validate`, falhando e se autocorrigindo.
6. **Resultados (2 min):** tabela de `experiment/metrics.md`, comparando erros, violações e intervenções.
7. **Análise e conclusão (2 min):** o que o harness preveniu, o que não preveniu, limitações, o que aprendeu sobre paradigmas (reativo vs. imperativo, declarativo, composição de streams).
