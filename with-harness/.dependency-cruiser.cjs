/** Regras arquiteturais verificadas automaticamente. Veja docs/ARCHITECTURE.md */
module.exports = {
  forbidden: [
    {
      name: 'domain-puro-sem-camadas-externas',
      comment: 'domain/ é puro: não pode depender de infra, streams ou app.',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(infra|streams|app)' },
    },
    {
      name: 'domain-sem-rxjs',
      comment: 'domain/ não pode importar rxjs (apenas tipos e funções puras).',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: 'node_modules/rxjs' },
    },
    {
      name: 'streams-sem-infra-e-app',
      comment: 'streams/ recebe Observables por parâmetro; não importa infra nem app.',
      severity: 'error',
      from: { path: '^src/streams' },
      to: { path: '^src/(infra|app)' },
    },
    {
      name: 'infra-sem-app-e-streams',
      comment: 'infra/ não conhece a composição (app) nem os pipelines (streams).',
      severity: 'error',
      from: { path: '^src/infra' },
      to: { path: '^src/(app|streams)' },
    },
    {
      name: 'sem-dependencia-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    tsPreCompilationDeps: true,
  },
};
