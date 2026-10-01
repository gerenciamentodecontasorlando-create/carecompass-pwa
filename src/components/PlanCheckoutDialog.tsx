import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/contexts/AuthContext";

interface Props {
  priceId: string | null;
  planName?: string;
  onClose: () => void;
}

export function PlanCheckoutDialog({ priceId, planName, onClose }: Props) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Dialog open={Boolean(priceId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
        <PaymentTestModeBanner />
        <DialogHeader className="px-6 pt-5"><DialogTitle>Assinar {planName}</DialogTitle></DialogHeader>
        <div className="px-2 pb-4">{priceId && <StripeEmbeddedCheckout priceId={priceId} customerEmail={user.email} userId={user.id} />}</div>
      </DialogContent>
    </Dialog>
  );
}