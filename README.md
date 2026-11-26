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

### Tabela comparativa

| Rodada | Versão | Erros de tipo | Erros de lint | Violações RxJS | Violações arquiteturais | Testes (falhos/total) | Intervenções humanas | Iterações validate→correção | Tempo (min) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | sem harness | 0 | 4 | 0 | 0 | 0/4 | 0 | n/a | ~15 |
| 2 | sem harness | 0 | 5 | 0 | 0 | 0/4 | 0 | n/a | ~10 |
| 3 | sem harness | 0 | 5 | 0 | 0 | 0/4 | 0 | n/a | ~6 |
| 1 | com harness | 0 | 0 | 0 | 0 | 0/6 | 0 | ~2 | ~20 |
| 2 | com harness | 0 | 0 | 0 | 0 | 0/7 | 0 | ~1 | ~25 |
| 3 | com harness | 0 | 0 | 0 | 0 | 0/7 | 0 | ~2 | ~15 |

### Médias

| Versão | Erros tipo | Lint | RxJS | Arquit. | Testes falhos | Intervenções |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **sem harness** | 0 | 4.67 | 0 | 0 | 0 | 0 |
| **com harness** | 0 | 0 | 0 | 0 | 0 | 0 |

### Análise qualitativa

**Redução drástica de erros de lint.** A diferença mais evidente foi a qualidade do código gerado. Sem o harness, o agente produziu uma média de **4,67 erros de lint** por rodada — o código compilava, mas ignorava padrões de clean code. Com o harness ativo, a média caiu para **zero**. O `AGENTS.md` e os scripts de validação forçam o agente a entrar em um ciclo de autocorreção: ele roda o `npm run validate`, vê o erro de lint e conserta antes de entregar o resultado.

**Cobertura de testes.** A presença do harness também alterou a postura do agente em relação aos testes. Na pasta `without-harness`, o agente se limitou ao mínimo (4 testes em todas as rodadas). Já na pasta `with-harness`, ele criou entre 6 e 7 testes. Em um paradigma orientado a eventos, onde fluxos assíncronos são difíceis de depurar visualmente, a garantia de testes é vital para evitar vazamentos de memória (subscriptions não fechadas) e falhas silenciosas.

**Violações arquiteturais e RxJS.** Ambas as abordagens apresentaram **0 violações arquiteturais** e **0 violações de RxJS**. Isso indica que o agente possui um conhecimento nativo forte sobre a biblioteca RxJS e sobre a arquitetura proposta, acertando a estrutura mesmo "às cegas". A diferença sutil está na **manutenibilidade**: o código sem harness pode até ter a estrutura correta, mas os erros de lint mostram que ele carece de padronização e legibilidade.

**O que o harness não pegou?** O harness garante qualidade sintática (tipos, lint, arquitetura), mas não garante a **regra de negócio**. A lógica matemática da média móvel ou o tempo exato de debounce do alerta podem ter sido implementados de forma incorreta, pois isso exigiria testes de integração com tempo simulado (fake timers) mais complexos, que não estavam no escopo do `validate` básico.

**O agente tentou burlar o harness?** Não foram encontrados `@ts-ignore` ou diretivas `eslint-disable` nos arquivos finais. O agente corrigiu o código de forma legítima (ajustando a tipagem e o padrão de importação) em vez de tentar silenciar o linter.