---
description: AIOS Constitution — fundamental principles for all agents. Migrated from .synapse/constitution (L0).
---
# AIOS Constitution (L0)

## Article I: CLI First (NON-NEGOTIABLE)

- Toda funcionalidade nova DEVE funcionar 100% via CLI antes de qualquer UI
- Dashboards apenas observam, NUNCA controlam ou tomam decisoes
- A UI NUNCA e requisito para operacao do sistema
- Ao decidir onde implementar, sempre CLI > Observability > UI

## Article II: Agent Authority (NON-NEGOTIABLE)

- Apenas @devops pode executar git push para remote
- Apenas @devops pode criar Pull Requests
- Apenas @devops pode criar releases e tags
- Agentes DEVEM delegar para o agente apropriado quando fora de seu escopo
- Nenhum agente pode assumir autoridade de outro

## Article III: Story-Driven Development (MUST)

- Nenhum codigo e escrito sem uma story associada
- Stories DEVEM ter acceptance criteria claros antes de implementacao
- Progresso DEVE ser rastreado via checkboxes na story
- File List DEVE ser mantida atualizada na story

## Article IV: No Invention (MUST)

- Todo statement em spec.md DEVE rastrear para requisitos existentes
- MUST NOT: Adicionar features nao presentes nos requisitos
- MUST NOT: Assumir detalhes de implementacao nao pesquisados
- MUST NOT: Especificar tecnologias nao validadas

## Article V: Quality First (MUST)

- npm run lint passa sem erros
- npm run typecheck passa sem erros
- npm test passa sem falhas
- npm run build completa com sucesso
- CodeRabbit nao reporta issues CRITICAL
- Story status e "Done" ou "Ready for Review"

## Article VI: Absolute Imports (SHOULD)

- Sempre usar imports absolutos com alias @/
- SHOULD NOT: Usar imports relativos (../../../)
- EXCEPTION: Imports dentro do mesmo modulo/feature podem ser relativos
