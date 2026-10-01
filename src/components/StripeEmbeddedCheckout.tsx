import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

interface Props {
  priceId: string;
  customerEmail?: string;
  userId: string;
}

export function StripeEmbeddedCheckout({ priceId, customerEmail, userId }: Props) {
  const fetchClientSecret = async () => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: {
        priceId,
        quantity: 1,
        customerEmail,
        userId,
        environment: getStripeEnvironment(),
        returnUrl: `${window.location.origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      },
    });
    if (error || !data?.clientSecret) throw new Error(error?.message || "Não foi possível iniciar o pagamento.");
    return data.clientSecret as string;
  };

  return <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>;
}