// Pediatric anamnesis form schema by age group
// Based on SBP (Sociedade Brasileira de Pediatria) and Ministério da Saúde (Caderneta da Criança)

export type AgeGroup =
  | "neonate"      // 0-28 days
  | "infant"       // 1-24 months
  | "preschool"    // 2-6 years
  | "schoolage"    // 7-10 years
  | "adolescent";  // 11-18 years

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "date";
  options?: string[];
  placeholder?: string;
}

export interface SectionDef {
  title: string;
  fields: FieldDef[];
}

export function getAgeGroupFromMonths(ageMonths: number): AgeGroup {
  if (ageMonths < 1) return "neonate";
  if (ageMonths < 24) return "infant";
  if (ageMonths < 84) return "preschool";
  if (ageMonths < 132) return "schoolage";
  return "adolescent";
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  neonate: "Recém-nascido (0-28 dias)",
  infant: "Lactente (1-24 meses)",
  preschool: "Pré-escolar (2-6 anos)",
  schoolage: "Escolar (7-10 anos)",
  adolescent: "Adolescente (11-18 anos)",
};

const COMMON_SECTIONS: SectionDef[] = [
  {
    title: "Antecedentes Gestacionais e Perinatais",
    fields: [
      { name: "pregnancy_planned", label: "Gestação planejada?", type: "select", options: ["Sim", "Não"] },
      { name: "prenatal_care", label: "Pré-natal (nº consultas)", type: "number" },
      { name: "maternal_diseases", label: "Doenças/intercorrências maternas", type: "textarea" },
      { name: "delivery_type", label: "Tipo de parto", type: "select", options: ["Vaginal", "Cesáreo", "Fórceps"] },
      { name: "gestational_age_weeks", label: "Idade gestacional (semanas)", type: "number" },
      { name: "birth_weight_g", label: "Peso ao nascer (g)", type: "number" },
      { name: "birth_length_cm", label: "Comprimento ao nascer (cm)", type: "number" },
      { name: "birth_hc_cm", label: "PC ao nascer (cm)", type: "number" },
      { name: "apgar_1_5", label: "Apgar 1º / 5º min", type: "text", placeholder: "Ex: 8/9" },
    ],
  },
  {
    title: "História Familiar",
    fields: [
      { name: "family_diseases", label: "Doenças hereditárias na família", type: "textarea", placeholder: "HAS, DM, asma, atopias, neoplasias..." },
      { name: "consanguinity", label: "Consanguinidade dos pais?", type: "select", options: ["Não", "Sim"] },
      { name: "siblings_health", label: "Irmãos (saúde / óbitos)", type: "textarea" },
    ],
  },
  {
    title: "Alergias e Medicações",
    fields: [
      { name: "allergies", label: "Alergias conhecidas", type: "textarea", placeholder: "Medicamentos, alimentos, ambientais..." },
      { name: "current_medications", label: "Medicações em uso contínuo", type: "textarea" },
    ],
  },
  {
    title: "Calendário Vacinal (PNI)",
    fields: [
      { name: "vaccines_up_to_date", label: "Vacinas em dia conforme PNI?", type: "select", options: ["Sim", "Não", "Parcialmente"] },
      { name: "vaccines_pending", label: "Vacinas pendentes ou em atraso", type: "textarea" },
      { name: "vaccines_special", label: "Vacinas particulares (Meningo B, HPV, etc.)", type: "textarea" },
    ],
  },
];

const SPECIFIC_SECTIONS: Record<AgeGroup, SectionDef[]> = {
  neonate: [
    {
      title: "Triagens Neonatais",
      fields: [
        { name: "test_pezinho", label: "Teste do pezinho realizado?", type: "select", options: ["Sim", "Não", "Pendente"] },
        { name: "test_orelhinha", label: "Teste da orelhinha (EOA)", type: "select", options: ["Passou", "Falhou", "Pendente"] },
        { name: "test_olhinho", label: "Teste do olhinho (reflexo vermelho)", type: "select", options: ["Normal", "Alterado", "Pendente"] },
        { name: "test_coracaozinho", label: "Teste do coraçãozinho (oximetria)", type: "select", options: ["Normal", "Alterado", "Pendente"] },
        { name: "test_linguinha", label: "Teste da linguinha (frênulo)", type: "select", options: ["Normal", "Alterado", "Pendente"] },
      ],
    },
    {
      title: "Aleitamento e Eliminações",
      fields: [
        { name: "feeding", label: "Tipo de aleitamento", type: "select", options: ["Materno exclusivo", "Misto", "Fórmula"] },
        { name: "feeding_frequency", label: "Frequência das mamadas", type: "text" },
        { name: "urine_output", label: "Diurese (nº fraldas/24h)", type: "text" },
        { name: "stool_pattern", label: "Padrão evacuatório", type: "text" },
        { name: "umbilical_stump", label: "Coto umbilical", type: "text" },
        { name: "jaundice", label: "Icterícia (Kramer)", type: "text", placeholder: "Zona/grau" },
      ],
    },
  ],
  infant: [
    {
      title: "Alimentação",
      fields: [
        { name: "exclusive_breastfeeding_until", label: "AME até (meses)", type: "number" },
        { name: "current_feeding", label: "Alimentação atual", type: "textarea" },
        { name: "food_introduction", label: "Introdução alimentar (idade início)", type: "text" },
        { name: "food_difficulties", label: "Dificuldades alimentares", type: "textarea" },
      ],
    },
    {
      title: "Desenvolvimento Neuropsicomotor (DNPM)",
      fields: [
        { name: "social_smile", label: "Sorriso social (esperado: 2m)", type: "text" },
        { name: "head_control", label: "Sustento cefálico (esperado: 3-4m)", type: "text" },
        { name: "rolls_over", label: "Rola (esperado: 4-6m)", type: "text" },
        { name: "sits_alone", label: "Senta sem apoio (esperado: 6-8m)", type: "text" },
        { name: "crawls", label: "Engatinha (esperado: 9-10m)", type: "text" },
        { name: "walks", label: "Anda (esperado: 12-15m)", type: "text" },
        { name: "first_words", label: "Primeiras palavras (esperado: 12m)", type: "text" },
        { name: "phrases", label: "Frases de 2 palavras (esperado: 18-24m)", type: "text" },
      ],
    },
    {
      title: "Sono e Comportamento",
      fields: [
        { name: "sleep_pattern", label: "Padrão de sono", type: "textarea" },
        { name: "colic", label: "Cólicas / refluxo", type: "textarea" },
        { name: "behavior_notes", label: "Observações comportamentais", type: "textarea" },
      ],
    },
  ],
  preschool: [
    {
      title: "Alimentação e Hábitos",
      fields: [
        { name: "diet_quality", label: "Qualidade da dieta", type: "textarea" },
        { name: "appetite", label: "Apetite", type: "select", options: ["Bom", "Regular", "Reduzido", "Seletivo"] },
        { name: "screen_time_hours", label: "Tempo de tela (h/dia)", type: "number" },
        { name: "physical_activity", label: "Atividade física", type: "text" },
      ],
    },
    {
      title: "Desenvolvimento e Socialização",
      fields: [
        { name: "sphincter_control_day", label: "Controle esfincteriano diurno", type: "text" },
        { name: "sphincter_control_night", label: "Controle esfincteriano noturno", type: "text" },
        { name: "language_development", label: "Linguagem (compreensão / expressão)", type: "textarea" },
        { name: "school_attendance", label: "Frequenta escola/creche?", type: "select", options: ["Sim", "Não"] },
        { name: "social_interaction", label: "Interação social", type: "textarea" },
      ],
    },
    {
      title: "Saúde e Segurança",
      fields: [
        { name: "accidents_history", label: "Histórico de acidentes domésticos", type: "textarea" },
        { name: "household_safety", label: "Medidas de segurança em casa", type: "textarea" },
        { name: "passive_smoking", label: "Tabagismo passivo?", type: "select", options: ["Não", "Sim"] },
      ],
    },
  ],
  schoolage: [
    {
      title: "Vida Escolar",
      fields: [
        { name: "school_grade", label: "Ano escolar", type: "text" },
        { name: "school_performance", label: "Rendimento escolar", type: "select", options: ["Bom", "Regular", "Insatisfatório"] },
        { name: "learning_difficulties", label: "Dificuldades de aprendizagem", type: "textarea" },
        { name: "bullying", label: "Bullying (sofre/pratica)", type: "textarea" },
      ],
    },
    {
      title: "Hábitos de Vida",
      fields: [
        { name: "diet_quality", label: "Alimentação", type: "textarea" },
        { name: "physical_activity", label: "Atividade física (tipo/freq.)", type: "text" },
        { name: "screen_time_hours", label: "Tempo de tela (h/dia)", type: "number" },
        { name: "sleep_hours", label: "Horas de sono", type: "number" },
        { name: "hygiene", label: "Higiene (oral, corporal)", type: "textarea" },
      ],
    },
    {
      title: "Saúde Geral",
      fields: [
        { name: "vision_complaints", label: "Queixas visuais", type: "textarea" },
        { name: "hearing_complaints", label: "Queixas auditivas", type: "textarea" },
        { name: "behavior_notes", label: "Comportamento / humor", type: "textarea" },
      ],
    },
  ],
  adolescent: [
    {
      title: "HEEADSSS — Avaliação Psicossocial",
      fields: [
        { name: "h_home", label: "H — Home (família, moradia)", type: "textarea" },
        { name: "e_education", label: "E — Education/Employment (escola, trabalho)", type: "textarea" },
        { name: "e_eating", label: "E — Eating (alimentação, imagem corporal)", type: "textarea" },
        { name: "a_activities", label: "A — Activities (lazer, amigos)", type: "textarea" },
        { name: "d_drugs", label: "D — Drugs (tabaco, álcool, drogas)", type: "textarea" },
        { name: "s_sexuality", label: "S — Sexuality (orientação, atividade, contracepção)", type: "textarea" },
        { name: "s_suicide", label: "S — Suicide/Mood (humor, ideação)", type: "textarea" },
        { name: "s_safety", label: "S — Safety (violência, acidentes)", type: "textarea" },
      ],
    },
    {
      title: "Desenvolvimento Puberal",
      fields: [
        { name: "tanner_stage", label: "Estágio de Tanner (M/G ou P)", type: "text", placeholder: "Ex: M3/P3" },
        { name: "menarche", label: "Menarca (idade) — se aplicável", type: "text" },
        { name: "menstrual_cycle", label: "Ciclo menstrual", type: "textarea" },
        { name: "voice_change", label: "Mudança de voz / pelos faciais", type: "text" },
      ],
    },
    {
      title: "Saúde Mental e Física",
      fields: [
        { name: "mental_health", label: "Saúde mental (ansiedade, depressão)", type: "textarea" },
        { name: "physical_activity", label: "Atividade física", type: "text" },
        { name: "chronic_complaints", label: "Queixas crônicas", type: "textarea" },
      ],
    },
  ],
};

export function getAnamnesisSchema(ageGroup: AgeGroup): SectionDef[] {
  return [...COMMON_SECTIONS, ...SPECIFIC_SECTIONS[ageGroup]];
}
