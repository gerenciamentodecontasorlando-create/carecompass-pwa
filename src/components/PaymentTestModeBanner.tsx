export function PaymentTestModeBanner() {
  const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
  if (!token) {
    return <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">Pagamentos reais ainda não estão liberados.</div>;
  }
  if (token.startsWith("pk_test_")) {
    return <div className="w-full border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-warning">Ambiente de teste: nenhuma cobrança real será realizada.</div>;
  }
  return null;
}