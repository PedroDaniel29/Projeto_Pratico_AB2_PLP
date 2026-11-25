# Harness para agentes de IA — Programação Reativa (TypeScript + RxJS)

Trabalho de **Paradigmas de Linguagem de Programação**. Compara a implementação da mesma funcionalidade por um agente de IA **com** e **sem** um *harness* (instruções, regras arquiteturais, lint, testes e scripts de validação), medindo erros, violações arquiteturais e intervenções humanas.

**Autor(es):** Pedro Daniel  
**Vídeo:** _link_

## A funcionalidade
Monitor de sensores orientado a eventos: leituras entram por um `EventBus`, são agrupadas por sensor, janeladas no tempo, e geram alertas quando a média passa de um limiar, com reenvio resiliente (`retry`) e encerramento limpo. Prompt completo em [`experiment/prompt.md`](experiment/prompt.md).

## Estrutura
```
with-harness/      projeto COM harness (AGENTS.md, regras, lint, testes, validate)
without-harness/   mesmo código-semente, SEM nada disso
experiment/        prompt, métricas, script de medição e logs
docs/              roteiro do vídeo
```

## O harness (with-harness/)
| Peça | Arquivo | Papel |
|---|---|---|
| Instruções | `AGENTS.md` | Contexto, fluxo (teste → código → validate) e proibições |
| Regras arquiteturais | `docs/ARCHITECTURE.md` | Camadas e regras R1–R9 de programação reativa |
| Verificação de camadas | `.dependency-cruiser.cjs` | `domain` puro, sem `rxjs`, sem ciclos |
| Lint reativo | `eslint.config.js` | `eslint-plugin-rxjs-x` + `no-any`, `no-console`, Subject só em `infra` |
| Testes | `tests/` | Vitest + `TestScheduler` (marble tests) |
| Sensor | `scripts/validate.sh` | Roda tudo e devolve código de erro |

## Como rodar
```bash
cd with-harness && npm install && npm run validate   # deve passar no estado inicial
cd ../without-harness && npm install
```

## Como executar o experimento
1. Abra um agente (ex.: Claude Code) em `with-harness/` e outro, em sessão nova, em `without-harness/`.
2. Cole o prompt de `experiment/prompt.md` **sem alterações**. Mesmo agente e modelo nos dois casos.
3. Conte cada correção/dica sua como 1 intervenção humana; salve a conversa em `experiment/logs/`.
4. Ao final de cada rodada, meça com as mesmas ferramentas:
   ```bash
   node experiment/measure.mjs with-harness   com-harness-1
   node experiment/measure.mjs without-harness sem-harness-1
   ```
   (o script usa as configs de `with-harness/` para medir também o código sem harness)
5. Repita 3 vezes por versão (limpe a pasta `src/` entre rodadas: `git checkout -- . && git clean -fd`) e preencha `experiment/metrics.md`.

## Resultados
_Preencher com a tabela final de `experiment/metrics.md` e a análise._

## Limitações
- Poucas rodadas por versão (variabilidade do agente).
- O harness não valida a **lógica** do alerta, só estrutura e estilo, a menos que os testes cubram.
- Intervenções humanas são contadas manualmente.
