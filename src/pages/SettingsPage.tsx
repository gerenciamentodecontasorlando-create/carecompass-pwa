import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface ClinicSettings {
  professionalName: string;
  specialty: string;
  registrationNumber: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
}

const SettingsPage = () => {
  const [settings, setSettings] = useLocalStorage<ClinicSettings>("clinicSettings", {
    professionalName: "",
    specialty: "",
    registrationNumber: "",
    clinicName: "",
    address: "",
    phone: "",
    email: "",
  });

  const [form, setForm] = useState(settings);

  const handleSave = () => {
    setSettings(form);
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados do Profissional</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome completo</Label>
                <Input value={form.professionalName} onChange={(e) => setForm({ ...form, professionalName: e.target.value })} placeholder="Dr(a). João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Especialidade</Label>
                  <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Odontologia, Clínica Geral..." />
                </div>
                <div className="grid gap-2">
                  <Label>CRO / CRM</Label>
                  <Input value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="CRO-SP 12345" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Dados da Clínica</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome da clínica</Label>
                <Input value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })} placeholder="Clínica Odontológica Sorriso" />
              </div>
              <div className="grid gap-2">
                <Label>Endereço completo</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua Exemplo, 123 - Centro - São Paulo/SP" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@clinica.com" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Esses dados serão usados no cabeçalho e rodapé dos receituários e atestados.
          </p>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
