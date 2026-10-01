# Acesso vitalício e planos personalizados

## Objetivo
- Manter o administrador da plataforma com acesso vitalício, sem bloqueio por teste, assinatura ou limite de IA.
- Permitir que o administrador configure um plano individual para cada clínica diretamente no painel administrativo.

## Alterações
- Adicionar às clínicas uma validade opcional do plano e um nome personalizado exibido no painel.
- Atualizar a regra administrativa para salvar, de uma vez, nome do plano, limite de pacientes, armazenamento, uso mensal de IA e validade.
- Tratar validade vazia como acesso sem vencimento; quando a validade terminar, bloquear a clínica como plano expirado.
- Fazer as verificações de IA reconhecerem o administrador da plataforma como acesso completo e ilimitado.
- Ampliar cada clínica no painel administrativo com uma área “Plano personalizado”, campos organizados e ação de salvar.
- Manter os planos prontos atuais como atalhos que preenchem os limites conhecidos.
- Identificar visualmente o administrador como “Vitalício” no painel.

## Segurança
- Somente contas registradas como administradores da plataforma poderão alterar planos e limites.
- A condição vitalícia será derivada do cadastro protegido de administrador, não de informação editável no navegador.

## Validação
- Confirmar que a conta administradora atual continua acessando o sistema e a IA mesmo sem validade.
- Confirmar que uma clínica recebe plano personalizado e que seus limites e vencimento aparecem corretamente após salvar.
- Confirmar que usuários comuns não conseguem executar alterações administrativas.
