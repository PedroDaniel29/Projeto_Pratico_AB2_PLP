# AGENTS.md — Monitor de sensores reativo (TypeScript + RxJS)

Você é um agente de código trabalhando neste repositório. Leia este arquivo e `docs/ARCHITECTURE.md` **antes de escrever qualquer código**.

## Contexto
Backend orientado a eventos. Leituras de sensores entram por um `EventBus`, são processadas por pipelines RxJS e geram eventos de alerta. Foco: Programação Reativa (streams, operadores, tratamento de erro, ciclo de vida de subscriptions).

## Comandos
- `npm install` — instala dependências
- `npm run validate` — **sensor obrigatório**: tipos + lint + arquitetura + testes
- `npm run typecheck | lint | arch | test` — etapas individuais

## Fluxo obrigatório
1. Leia `docs/ARCHITECTURE.md`.
2. Escreva primeiro o teste (marble test com `tests/helpers/marble.ts` para qualquer tempo/debounce/buffer/retry).
3. Implemente a funcionalidade.
4. Rode `npm run validate`.
5. Se falhar, corrija **a causa** e rode de novo. Repita até passar.
6. Só então diga que terminou. Nunca diga "pronto" com `validate` falhando.

## Regras que você NÃO pode quebrar
- **Nunca** desative regras (`eslint-disable`, `@ts-ignore`, `@ts-expect-error`) nem edite `eslint.config.js`, `.dependency-cruiser.cjs`, `tsconfig.json` ou `scripts/validate.sh` para fazer o validate passar.
- `src/domain/` é puro: sem `rxjs`, sem I/O, sem importar de `infra/`, `streams/` ou `app/`.
- Pipelines ficam em `src/streams/` como **funções puras** que recebem `Observable` e devolvem `Observable`.
- `Subject`/`BehaviorSubject` só em `src/infra/`, sempre privados, expostos via `asObservable()`.
- **Proibido** `subscribe` dentro de `subscribe`; use `switchMap`/`mergeMap`/`concatMap`.
- Toda subscription precisa de um fim: `takeUntil(destroy$)`, `take`, ou `Subscription` guardada e liberada em `stop()`.
- Todo `subscribe` precisa de tratamento de erro; todo pipe com I/O precisa de `catchError` (e `retry` com limite quando fizer sentido). Um erro nunca derruba o stream principal.
- Sem `async/await` dentro de operadores: converta com `from(promise)`/`defer`.
- Sem `any`, sem `console.log`.
- Tempo sempre injetável (scheduler/parâmetro) para ser testável com `TestScheduler`.

## Estrutura
```
src/domain/   eventos e funções puras
src/streams/  pipelines RxJS (puros, sem Subject)
src/infra/    EventBus, adaptadores com efeito colateral
src/app/      composição (startMonitor) e ciclo de vida
tests/        unitários + marble tests
```
