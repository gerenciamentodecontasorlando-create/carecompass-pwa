# Módulo Pediatria — Avaliação personalizada

Vou criar **duas novas funcionalidades independentes** dentro de um novo módulo "Pediatria", acessível pelo menu lateral, separado da ficha clínica genérica adulta.

## 1. Avaliação Antropométrica com Curvas da OMS

Página dedicada que recebe dados do paciente (idade, sexo, peso, altura, PC) e calcula em tempo real os indicadores oficiais da OMS.

**Cálculos (Z-score e percentil):**
- Peso/Idade (P/I) — 0 a 10 anos
- Estatura/Idade (E/I) — 0 a 19 anos
- Peso/Estatura (P/E) — 0 a 5 anos
- IMC/Idade (IMC/I) — 0 a 19 anos
- Perímetro Cefálico/Idade (PC/I) — 0 a 5 anos
- Velocidade de crescimento (comparação com medições anteriores)

**Visualização:**
- Gráfico de curva (recharts) mostrando as faixas P3, P15, P50, P85, P97 da OMS + ponto da criança plotado
- Classificação automática em cores (eutrofia, risco, magreza, sobrepeso, obesidade, baixa estatura) com alertas visuais
- Histórico de medições do paciente plotado na mesma curva (acompanhamento longitudinal)

**Particularidades exclusivas:**
- Alerta clínico automático quando Z-score < -2 ou > +2
- Sugestão de conduta inicial baseada na classificação
- Cálculo de idade gestacional corrigida para prematuros (<37s) até os 2 anos
- Exportação em PDF do laudo antropométrico com gráficos para entregar aos pais
- Marcos do desenvolvimento (DNPM) por idade — checklist Denver simplificado

**Fonte de dados:** tabelas LMS oficiais da OMS (2006/2007) embutidas como JSON no app — funciona offline.

## 2. Anamnese Pediátrica por Faixa Etária

Ficha estruturada baseada nos protocolos da SBP (Sociedade Brasileira de Pediatria) e Caderneta da Criança do MS, com formulários adaptativos:

**Faixas etárias com campos específicos:**
- **0–28 dias (RN)**: Apgar, IG, peso ao nascer, tipo parto, intercorrências, triagens neonatais (pezinho, orelhinha, olhinho, coraçãozinho, linguinha), aleitamento, eliminações
- **1–24 meses (lactente)**: aleitamento materno exclusivo, introdução alimentar, vacinação por mês, sono, cólicas, marcos motores
- **2–6 anos (pré-escolar)**: alimentação, controle esfincteriano, sono, socialização, linguagem, acidentes domésticos
- **7–10 anos (escolar)**: rendimento escolar, atividade física, alimentação, bullying, higiene
- **11–18 anos (adolescente)**: HEEADSSS (Home, Education, Eating, Activities, Drugs, Sexuality, Suicide, Safety), Tanner, menarca

**Campos comuns sempre presentes:**
- Antecedentes gestacionais e perinatais
- História familiar (com foco em hereditariedades pediátricas)
- Vacinação (calendário PNI completo com check)
- Alergias e medicações em uso
- Desenvolvimento neuropsicomotor

**Particularidades exclusivas:**
- Formulário se adapta automaticamente conforme a idade do paciente cadastrado
- Alertas para vacinas em atraso baseados no calendário PNI atual
- Vinculação direta à avaliação antropométrica (mesmo paciente)
- Salvamento de rascunho automático (sessionStorage) — já é padrão no projeto
- Exportação em PDF da anamnese completa para o prontuário

## Arquitetura técnica

**Backend (1 migration):**
- Tabela `pediatric_assessments` (clinic_id, patient_id, date, weight, height, head_circumference, gestational_age_weeks, calculated_indicators jsonb, classification)
- Tabela `pediatric_anamnesis` (clinic_id, patient_id, age_group, form_data jsonb, created_at, updated_at)
- RLS por `clinic_id` (padrão já em uso)
- Soft-delete via `deleted_at`

**Frontend:**
- Nova rota `/pediatria` com duas abas: "Antropometria" e "Anamnese"
- Item no `AppSidebar` com ícone `Baby` (lucide)
- Tradução PT/ES nos arquivos `i18n`
- Tabelas LMS da OMS em `src/lib/whoGrowthData.ts` (JSON estático)
- Componente `GrowthChart.tsx` usando recharts
- Componente `PediatricAnamnesisForm.tsx` com seções condicionais por faixa etária
- Cálculo de Z-score em `src/lib/whoZScore.ts` (fórmula LMS oficial)

**Integração:**
- Acessível também pelo perfil do paciente (`PatientProfile.tsx`) quando a idade for ≤ 18 anos
- Dados antropométricos somam-se ao histórico do paciente (não substituem a ficha SOAP)
- Sem uso de IA nessa primeira versão — cálculos puramente determinísticos da OMS (mais seguros clinicamente)

## Escopo desta entrega

Vou implementar **as duas funções completas** em sequência, começando pela infraestrutura (migration + libs OMS) e depois UI. A IA fica de fora nesta primeira versão por segurança clínica — só fórmulas validadas da OMS/SBP.

Confirma para eu começar?
