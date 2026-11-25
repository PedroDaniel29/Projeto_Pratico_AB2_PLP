#!/usr/bin/env bash
# Sensor do harness: o agente DEVE rodar isto antes de dizer que terminou.
set -u
cd "$(dirname "$0")/.."

fail=0
run() {
  local name="$1"; shift
  echo "▶ $name"
  if "$@"; then echo "✔ $name"; else echo "✖ $name FALHOU"; fail=1; fi
  echo
}

run "Tipos (tsc)"                        npx tsc --noEmit
run "Lint + regras RxJS (eslint)"        npx eslint src tests --max-warnings 0
run "Arquitetura (dependency-cruiser)"   npx depcruise src --config .dependency-cruiser.cjs
run "Testes (vitest)"                    npx vitest run

if [ "$fail" -eq 0 ]; then echo "✅ validate: tudo certo"; else echo "❌ validate: corrija os itens acima e rode de novo"; fi
exit "$fail"
