# Regras arquiteturais

Cada regra tem um **verificador automático**. Se não há verificador, a regra é convenção e deve ser coberta por teste.

## Camadas e dependências permitidas

```
app ──► streams ──► domain
 │                    ▲
 └──► infra ──────────┘
```

| Camada | Pode importar | Não pode importar |
|---|---|---|
| `domain` | nada além de si | `rxjs`, `infra`, `streams`, `app` |
| `streams` | `domain`, `rxjs` | `infra`, `app` |
| `infra` | `domain`, `rxjs` | `streams`, `app` |
| `app` | todas | — |

Verificador: `dependency-cruiser` (`npm run arch`).

## Regras de Programação Reativa

| # | Regra | Por quê | Verificador |
|---|---|---|---|
| R1 | Sem `subscribe` aninhado | Callback hell reativo, leaks | `rxjs-x/no-nested-subscribe` |
| R2 | Subscriptions têm fim (`takeUntil`/`take`/guardar `Subscription`) | Vazamento de memória | `rxjs-x/no-ignored-subscription`, `no-unsafe-takeuntil` |
| R3 | `subscribe` com handler de erro | Erro não tratado derruba o stream | `rxjs-x/no-ignored-error` |
| R4 | Subject encapsulado; só em `infra` | Qualquer um poderia chamar `next()` | `rxjs-x/no-exposed-subjects`, `no-restricted-syntax` |
| R5 | Sem `async` em `subscribe` | Perde backpressure e erros | `rxjs-x/no-async-subscribe` |
| R6 | Observables não ficam "soltos" | Efeito nunca executado | `rxjs-x/no-floating-observables` |
| R7 | Pipelines são funções puras `Observable → Observable` | Testabilidade | revisão + testes |
| R8 | Tempo injetável, testes com `TestScheduler` | Testes determinísticos | testes |
| R9 | Sem `any`, sem `console` | Segurança de tipos / ruído | `@typescript-eslint/no-explicit-any`, `no-console` |

## Padrões recomendados
- Janela de tempo: `bufferTime`/`windowTime`.
- Por chave: `groupBy` + `mergeMap`.
- Efeito colateral assíncrono com falha: `defer(() => op())` + `retry({ count, delay })` + `catchError`.
- Evitar repetição: `distinctUntilChanged`.
- Encerramento: um `Subject<void>` privado `destroy$` (ou `Subscription` única) liberado em `stop()`.
