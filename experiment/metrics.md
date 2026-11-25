# Métricas do experimento

Preencha uma linha por rodada. Rode `node experiment/measure.mjs <pasta> <rotulo>` ao final de cada rodada para obter os números automáticos (salvos em `experiment/logs/<rotulo>.json`). Os campos manuais você anota durante a sessão.

Agente: GitHub Copilot (VS Code)  Modelo: GPT-4o (Padrão)  Data: 25/11/2026

| Rodada | Versão | Erros de tipo | Erros de lint | Violações RxJS | Violações arquiteturais | Testes (falhos/total) | Intervenções humanas | Iterações validate→correção | Tempo (min) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | sem harness | 0 | 4 | 0 | 0 | 0/4 | 0 | n/a | ~15 |
| 2 | sem harness | 0 | 5 | 0 | 0 | 0/4 | 0 | n/a | ~10 |
| 3 | sem harness | 0 | 5 | 0 | 0 | 0/4 | 0 | n/a | ~6 |
| 1 | com harness | 0 | 0 | 0 | 0 | 0/6 | 0 | ~2 | ~20 |
| 2 | com harness | 0 | 0 | 0 | 0 | 0/7 | 0 | ~1 | ~25 |
| 3 | com harness | 0 | 0 | 0 | 0 | 0/7 | 0 | ~2 | ~15 |

## Médias
| Versão | Erros tipo | Lint | RxJS | Arquit. | Testes falhos | Intervenções |
|---|---|---|---|---|---|---|
| sem harness | 0 | 4.67 | 0 | 0 | 0 | 0 |
| com harness | 0 | 0 | 0 | 0 | 0 | 0 |

## Como contar
- **Violações RxJS:** erros do ESLint cujo `ruleId` começa com `rxjs-x/` (medido automaticamente).
- **Violações arquiteturais:** erros do dependency-cruiser + `no-restricted-syntax` (Subject fora de infra).
- **Intervenção humana:** toda mensagem sua além do prompt inicial (correção, dica, resposta a pergunta, ação manual no código).
- **Iterações:** quantas vezes o agente rodou `npm run validate` e precisou corrigir algo.

## Observações qualitativas

- **O agente tentou burlar o harness (desativar regra, `@ts-ignore`)?**
  Não foram encontrados `@ts-ignore` ou diretivas `eslint-disable` nos arquivos finais. O agente, ao receber a instrução no `AGENTS.md` para rodar o `npm run validate`, corrigiu o código de forma legítima (ajustando a tipagem e o padrão de importação) em vez de tentar silenciar o linter.

- **Que tipo de erro o harness NÃO pegou (ex.: lógica errada do alerta)?**
  O harness garante qualidade sintática (tipos, lint, arquitetura), mas não garante a **regra de negócio**. Por exemplo, a lógica matemática de calcular a "média móvel" do sensor ou o tempo exato de debounce do alerta pode ter sido implementada de forma incorreta, pois isso exigiria testes de integração com tempo simulado (fake timers) mais complexos, que não estavam no escopo do `validate` básico. A ausência de erros de arquitetura também não impede que um evento seja publicado na ordem errada.

- **Código final: qual ficou mais idiomático em RxJS?**
  O código da versão **com harness** ficou visivelmente mais idiomático. Sem o harness, o agente focou apenas em fazer funcionar, gerando erros de lint (provavelmente relacionados a variáveis não utilizadas, falta de tipagem explícita ou uso inadequado de operadores). Com o harness, o `AGENTS.md` forçou o uso correto de operadores de composição (como `pipe`, `filter`, `map`) e garantiu que as `subscriptions` fossem devidamente tratadas e encerradas (evitando vazamento de memória), o que é um pilar da Programação Reativa.