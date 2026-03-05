import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, UserRound, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  birth_date: string;
  cpf: string;
  address: string;
  notes: string;
  clinic_id: string;
}

const emptyForm = { name: "", phone: "", email: "", birth_date: "", cpf: "", address: "", notes: "" };

const Patients = () => {
  const navigate = useNavigate();
  const { data: patients, insert, update, remove } = useClinicData("patients");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = patients.filter((p) =>
    String(p.name).toLowerCase().includes(search.toLowerCase()) ||
    String(p.cpf).includes(search)
  );

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    if (editingId) {
      await update(editingId, form);
      toast.success("Paciente atualizado");
    } else {
      await insert(form);
      toast.success("Paciente cadastrado");
    }
    setForm(emptyForm);
    setEditingId(null);
    setOpen(false);
  };

  const handleEdit = (p: Record<string, unknown>) => {
    setForm({
      name: String(p.name || ""),
      phone: String(p.phone || ""),
      email: String(p.email || ""),
      birth_date: String(p.birth_date || ""),
      cpf: String(p.cpf || ""),
      address: String(p.address || ""),
      notes: String(p.notes || ""),
    });
    setEditingId(String(p.id));
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    toast.success("Paciente removido");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setForm(emptyForm); setEditingId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome completo *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Observações clínicas</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSave} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou CPF..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <UserRound className="h-12 w-12 mb-4 opacity-40" />
            <p>Nenhum paciente encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <Card key={String(p.id)} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/pacientes/${p.id}`)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserRound className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{String(p.name)}</p>
                    <p className="text-sm text-muted-foreground">{String(p.phone) || "Sem telefone"}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDelete(String(p.id)); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Patients;
