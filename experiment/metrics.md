# Métricas do experimento

Preencha uma linha por rodada. Rode `node experiment/measure.mjs <pasta> <rotulo>` ao final de cada rodada para obter os números automáticos (salvos em `experiment/logs/<rotulo>.json`). Os campos manuais você anota durante a sessão.

Agente: ____________  Modelo: ____________  Data: ____________

| Rodada | Versão | Erros de tipo | Erros de lint | Violações RxJS | Violações arquiteturais | Testes (falhos/total) | Intervenções humanas | Iterações validate→correção | Tempo (min) |
|---|---|---|---|---|---|---|---|---|---|
| 1 | sem harness | | | | | | | n/a | |
| 2 | sem harness | | | | | | | n/a | |
| 3 | sem harness | | | | | | | n/a | |
| 1 | com harness | | | | | | | | |
| 2 | com harness | | | | | | | | |
| 3 | com harness | | | | | | | | |

## Médias
| Versão | Erros tipo | Lint | RxJS | Arquit. | Testes falhos | Intervenções |
|---|---|---|---|---|---|---|
| sem harness | | | | | | |
| com harness | | | | | | |

## Como contar
- **Violações RxJS:** erros do ESLint cujo `ruleId` começa com `rxjs-x/` (medido automaticamente).
- **Violações arquiteturais:** erros do dependency-cruiser + `no-restricted-syntax` (Subject fora de infra).
- **Intervenção humana:** toda mensagem sua além do prompt inicial (correção, dica, resposta a pergunta, ação manual no código).
- **Iterações:** quantas vezes o agente rodou `npm run validate` e precisou corrigir algo.

## Observações qualitativas
- O agente tentou burlar o harness (desativar regra, `@ts-ignore`)?
- Que tipo de erro o harness NÃO pegou (ex.: lógica errada do alerta)?
- Código final: qual ficou mais idiomático em RxJS?
