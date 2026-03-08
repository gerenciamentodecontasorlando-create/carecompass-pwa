

## Problemas identificados

### 1. Rotação de tela em tablets
O manifest PWA já tem `"orientation": "any"` configurado corretamente. O problema provavelmente é que o CSS não adapta o layout quando o tablet rotaciona. Preciso:
- Adicionar uma **viewport meta tag** com suporte a orientação e um CSS que force o layout a recalcular em mudanças de orientação
- Adicionar um listener `orientationchange` / `resize` para garantir que o layout re-renderize
- Verificar se há CSS com larguras fixas que impedem a adaptação

### 2. Exportação de dados (para migrar PARA outro software)
A página `DataImport` já permite **importar** CSV de outros softwares, mas **não tem exportação**. Preciso adicionar:
- Botão "Exportar Pacientes" que gera um CSV com todos os dados da clínica
- Exportação de outros dados relevantes (agendamentos, financeiro, prontuários)
- Formato CSV universal compatível com outros sistemas

---

## Plano de implementação

### Rotação de tela em tablets
1. **`index.html`**: Garantir que a meta viewport não trave a orientação
2. **`src/index.css`**: Adicionar regras CSS com `@media (orientation: landscape)` e `@media (orientation: portrait)` para ajustar padding/layout. Adicionar `min-height: 100dvh` no body
3. **`src/components/AppLayout.tsx`**: Usar `window.innerHeight` via estado React para forçar re-render em mudanças de orientação (evento `resize`)

### Exportação de dados
4. **`src/pages/DataImport.tsx`** → renomear conceitualmente para "Importar/Exportar Dados":
   - Adicionar seção de **Exportação** com botões para exportar:
     - Pacientes (CSV)
     - Agendamentos (CSV)
     - Financeiro (CSV)
   - Usar `useClinicData` para buscar dados e gerar CSV no navegador
   - Download automático do arquivo gerado
   - Campos exportados: nome, telefone, email, CPF, nascimento, endereço, observações

Essas mudanças garantem que o app funcione bem em tablets rotacionados e que clínicas possam migrar dados de/para o Btx CliniCos livremente.

