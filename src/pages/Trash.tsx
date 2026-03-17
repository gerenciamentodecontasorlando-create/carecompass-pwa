import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

type DeletedItem = {
  id: string;
  table: string;
  label: string;
  sublabel: string;
  deleted_at: string;
  data: Record<string, unknown>;
};

const Trash = () => {
  const { clinicId } = useAuth();
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    if (!clinicId) return;
    setLoading(true);
    const allItems: DeletedItem[] = [];

    // Evolutions
    const { data: evos } = await supabase
      .from("evolutions")
      .select("*")
      .eq("clinic_id", clinicId)
      .not("deleted_at", "is", null);
    (evos || []).forEach((e: any) => {
      allItems.push({
        id: e.id,
        table: "evolutions",
        label: `Evolução — ${e.procedure || e.subjective || "Sem descrição"}`,
        sublabel: `Data: ${e.date} • Paciente ID: ${e.patient_id?.slice(0, 8)}...`,
        deleted_at: e.deleted_at,
        data: e,
      });
    });

    // Prescriptions
    const { data: presc } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("clinic_id", clinicId)
      .not("deleted_at", "is", null);
    (presc || []).forEach((p: any) => {
      allItems.push({
        id: p.id,
        table: "prescriptions",
        label: `Receituário — ${p.patient_name}`,
        sublabel: `Data: ${p.date}`,
        deleted_at: p.deleted_at,
        data: p,
      });
    });

    // Certificates
    const { data: certs } = await supabase
      .from("certificates")
      .select("*")
      .eq("clinic_id", clinicId)
      .not("deleted_at", "is", null);
    (certs || []).forEach((c: any) => {
      allItems.push({
        id: c.id,
        table: "certificates",
        label: `Atestado — ${c.patient_name}`,
        sublabel: `Data: ${c.date}`,
        deleted_at: c.deleted_at,
        data: c,
      });
    });

    // Clinical records
    const { data: clin } = await supabase
      .from("clinical_records")
      .select("*")
      .eq("clinic_id", clinicId)
      .not("deleted_at", "is", null);
    (clin || []).forEach((r: any) => {
      allItems.push({
        id: r.id,
        table: "clinical_records",
        label: `Prontuário clínico`,
        sublabel: `Paciente ID: ${r.patient_id?.slice(0, 8)}...`,
        deleted_at: r.deleted_at,
        data: r,
      });
    });

    allItems.sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime());
    setItems(allItems);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeleted();
  }, [clinicId]);

  const handleRestore = async (item: DeletedItem) => {
    const { error } = await supabase
      .from(item.table as any)
      .update({ deleted_at: null } as any)
      .eq("id", item.id);
    if (error) {
      toast.error("Erro ao restaurar");
      return;
    }
    toast.success("Item restaurado com sucesso!");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    const { error } = await supabase
      .from(item.table as any)
      .delete()
      .eq("id", item.id);
    if (error) {
      toast.error("Erro ao excluir permanentemente");
      return;
    }
    toast.success("Excluído permanentemente");
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const tableLabel = (t: string) => {
    const map: Record<string, string> = {
      evolutions: "Evoluções",
      prescriptions: "Receituários",
      certificates: "Atestados",
      clinical_records: "Prontuários",
    };
    return map[t] || t;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trash2 className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Lixeira</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Itens excluídos podem ser restaurados aqui.</p>
              <p className="text-muted-foreground">A exclusão permanente não pode ser desfeita.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">A lixeira está vazia 🎉</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">{tableLabel(item.table)}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Excluído em {format(new Date(item.deleted_at), "dd/MM/yyyy HH:mm")}
                      </span>
                    </div>
                    <p className="font-medium text-sm truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleRestore(item)} className="gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" />Restaurar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handlePermanentDelete(item)} className="gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Trash;
