import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Download, Upload, Volume2 } from "lucide-react";

interface ClinicSettings {
  professionalName: string;
  specialty: string;
  registrationNumber: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
}

interface JarvisSettings {
  enabled: boolean;
  alwaysListening: boolean;
  speed: number;
  pitch: number;
  volume: number;
  voiceGender: "male" | "female";
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

  const [jarvisSettings, setJarvisSettings] = useLocalStorage<JarvisSettings>("jarvisSettings", {
    enabled: true,
    alwaysListening: false,
    speed: 1.0,
    pitch: 0.9,
    volume: 1.0,
    voiceGender: "male",
  });

  const [form, setForm] = useState(settings);
  const [jarvisForm, setJarvisForm] = useState(jarvisSettings);

  const handleTestVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Olá, eu sou o Jarvis, seu assistente virtual.");
    utterance.lang = "pt-BR";
    utterance.rate = jarvisForm.speed;
    utterance.pitch = jarvisForm.pitch;
    utterance.volume = jarvisForm.volume;
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));
    if (jarvisForm.voiceGender === "male") {
      const male = ptVoices.find((v) =>
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("masculin") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("ricardo")
      );
      if (male) utterance.voice = male;
      else if (ptVoices[0]) utterance.voice = ptVoices[0];
    } else {
      const female = ptVoices.find((v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("femin") ||
        v.name.toLowerCase().includes("maria") ||
        v.name.toLowerCase().includes("luciana")
      );
      if (female) utterance.voice = female;
      else if (ptVoices[0]) utterance.voice = ptVoices[0];
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    setSettings(form);
    setJarvisSettings(jarvisForm);
    toast.success("Configurações salvas com sucesso!");
  };

  const BACKUP_KEYS = ["patients", "appointments", "clinicSettings", "financialEntries", "materials", "odontogramData", "clinicalRecords", "evolutions", "patientFiles"];

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    BACKUP_KEYS.forEach((key) => {
      const item = localStorage.getItem(key);
      if (item) data[key] = JSON.parse(item);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clinicapro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado com sucesso!");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        let count = 0;
        BACKUP_KEYS.forEach((key) => {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            count++;
          }
        });
        toast.success(`Backup importado! ${count} módulo(s) restaurado(s). Recarregando...`);
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error("Arquivo inválido. Selecione um backup JSON válido.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assistente Jarvis</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="jarvis-toggle" className="text-sm text-muted-foreground">
                {jarvisForm.enabled ? "Ativado" : "Desativado"}
              </Label>
              <Switch
                id="jarvis-toggle"
                checked={jarvisForm.enabled}
                onCheckedChange={(checked) => setJarvisForm({ ...jarvisForm, enabled: checked })}
              />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Velocidade da fala</Label>
                <span className="text-sm text-muted-foreground">{jarvisForm.speed.toFixed(1)}x</span>
              </div>
              <Slider
                value={[jarvisForm.speed]}
                onValueChange={([v]) => setJarvisForm({ ...jarvisForm, speed: v })}
                min={0.5}
                max={2.0}
                step={0.1}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Tom da voz (grave ↔ agudo)</Label>
                <span className="text-sm text-muted-foreground">{jarvisForm.pitch.toFixed(1)}</span>
              </div>
              <Slider
                value={[jarvisForm.pitch]}
                onValueChange={([v]) => setJarvisForm({ ...jarvisForm, pitch: v })}
                min={0.3}
                max={1.5}
                step={0.1}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Volume</Label>
                <span className="text-sm text-muted-foreground">{Math.round(jarvisForm.volume * 100)}%</span>
              </div>
              <Slider
                value={[jarvisForm.volume]}
                onValueChange={([v]) => setJarvisForm({ ...jarvisForm, volume: v })}
                min={0.1}
                max={1.0}
                step={0.05}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Estilo de Voz</Label>
            <div className="flex gap-3">
              <Button
                variant={jarvisForm.voiceGender === "male" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setJarvisForm({ ...jarvisForm, voiceGender: "male" })}
              >
                🧑 Masculina
              </Button>
              <Button
                variant={jarvisForm.voiceGender === "female" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setJarvisForm({ ...jarvisForm, voiceGender: "female" })}
              >
                👩 Feminina
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="always-listening">Escuta contínua por voz</Label>
              <p className="text-xs text-muted-foreground">Quando ativo, Jarvis fica ouvindo permanentemente</p>
            </div>
            <Switch
              id="always-listening"
              checked={jarvisForm.alwaysListening}
              onCheckedChange={(checked) => setJarvisForm({ ...jarvisForm, alwaysListening: checked })}
            />
          </div>

          <Button variant="outline" className="w-full" onClick={handleTestVoice}>
            <Volume2 className="h-4 w-4 mr-2" />Testar Voz
          </Button>

          <p className="text-sm text-muted-foreground">
            Ajuste a voz e o comportamento do Jarvis. Clique em "Testar Voz" para ouvir antes de salvar.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Backup de Dados</h2>
          <p className="text-sm text-muted-foreground">
            Exporte todos os dados do sistema para um arquivo JSON e importe em outro aparelho.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="flex-1" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />Exportar Dados
            </Button>
            <Button variant="outline" className="flex-1 relative" asChild>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />Importar Dados
                <input
                  type="file"
                  accept=".json"
                  className="sr-only"
                  onChange={handleImport}
                />
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
