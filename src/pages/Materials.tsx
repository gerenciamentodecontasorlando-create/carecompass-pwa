import { useState } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Trash2, AlertTriangle, Package } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const Materials = () => {
  const { data: materials, insert, update, remove } = useClinicData("materials");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "0", minQuantity: "5", unit: "un", category: "Consumível" });

  const filtered = materials.filter((m) => String(m.name).toLowerCase().includes(search.toLowerCase()));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    await insert({
      name: form.name,
      quantity: parseInt(form.quantity) || 0,
      min_quantity: parseInt(form.minQuantity) || 5,
      unit: form.unit,
      category: form.category,
    });
    setForm({ name: "", quantity: "0", minQuantity: "5", unit: "un", category: "Consumível" });
    setOpen(false);
    toast.success("Material adicionado");
  };

  const updateQty = async (id: string, currentQty: number, delta: number) => {
    await update(id, { quantity: Math.max(0, currentQty + delta) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Controle de Materiais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Material</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Material</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Qtd. Inicial</Label>
                  <Input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Qtd. Mínima</Label>
                  <Input type="number" min="0" value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Unidade</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidade</SelectItem>
                      <SelectItem value="cx">Caixa</SelectItem>
                      <SelectItem value="pct">Pacote</SelectItem>
                      <SelectItem value="ml">mL</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consumível">Consumível</SelectItem>
                    <SelectItem value="Instrumental">Instrumental</SelectItem>
                    <SelectItem value="Medicamento">Medicamento</SelectItem>
                    <SelectItem value="EPI">EPI</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar material..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-40" />
            <p>Nenhum material cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((m) => {
            const qty = Number(m.quantity);
            const minQty = Number(m.min_quantity);
            const isLow = qty <= minQty;
            return (
              <Card key={String(m.id)} className={isLow ? "border-destructive/50" : ""}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {isLow && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
                    <div>
                      <p className="font-semibold">{String(m.name)}</p>
                      <p className="text-xs text-muted-foreground">{String(m.category)} • Mín: {minQty} {String(m.unit)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(String(m.id), qty, -1)}>−</Button>
                    <Badge variant={isLow ? "destructive" : "secondary"} className="min-w-[60px] justify-center">
                      {qty} {String(m.unit)}
                    </Badge>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQty(String(m.id), qty, 1)}>+</Button>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      await remove(String(m.id));
                      toast.success("Material removido");
                    }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Materials;
