# Ajustar aviso do ambiente de teste

## Objetivo
- Remover o aviso persistente do topo das telas internas.
- Manter o aviso dentro da janela de assinatura, onde ele é relevante.
- Não apresentar pagamentos de teste como cobranças reais.

## Situação atual
A conta ainda não foi liberada para cobranças reais: a conexão da conta Stripe está em andamento e as demais etapas de ativação ainda estão bloqueadas. O plano Lovable Pro já está ativo.

## Alterações
- Retirar o aviso global do cabeçalho do sistema.
- Preservar o aviso no formulário de pagamento enquanto o checkout continuar em ambiente de teste.
- Validar que a tela principal não mostra mais a faixa e que o pagamento continua identificado corretamente.
