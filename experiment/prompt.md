# Prompt do experimento (IDÊNTICO nas duas versões)

Cole o texto abaixo, sem alterações, em uma **sessão nova** do agente, dentro da pasta correspondente (`with-harness/` ou `without-harness/`).

---

Implemente um **monitor de sensores reativo** em TypeScript com RxJS, neste projeto.

Requisitos:

1. Exporte `startMonitor(deps)` em `src/app/main.ts`. `deps` inclui o `EventBus` já existente, um `AlertSink` (objeto com `send(alert: AlertRaised): Promise<void>`, que pode falhar), o limiar (padrão 80), o tamanho da janela em ms (padrão 5000) e, opcionalmente, um scheduler. Retorna `{ stop(): void }`.
2. Consuma os eventos `SensorReadingReceived` do `EventBus` e **descarte leituras inválidas** (use `isValidReading`).
3. Agrupe as leituras **por `sensorId`** e, a cada janela de tempo, calcule a **média** de cada sensor.
4. Se a média da janela for **maior que o limiar**, emita um `AlertRaised`. Enquanto o sensor continuar acima do limiar, **não repita** o alerta; só alerte de novo depois que a média voltar a ficar abaixo.
5. Envie cada alerta ao `AlertSink`. Se `send` falhar, faça **até 3 tentativas** com espera entre elas. Se todas falharem, o erro não pode derrubar o monitor: os demais alertas continuam sendo processados.
6. `stop()` deve encerrar tudo sem deixar subscriptions abertas.
7. Escreva testes para o comportamento.

Quando terminar, diga o que foi feito.

---

> Regra do experimento: não dê dicas extras em nenhuma das versões. Cada vez que você precisar corrigir, redirecionar ou responder uma pergunta do agente, conte como **1 intervenção humana** e anote em `logs/`.
