import { useState, useEffect } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, LogOut, Volume2, RefreshCw } from "lucide-react";

const SettingsPage = () => {
  const { signOut, profile } = useAuth();
  const { data: settingsArr, update } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const settingsId = String(settings.id || "");

  const [form, setForm] = useState({
    professional_name: "",
    specialty: "",
    registration_number: "",
    clinic_name: "",
    address: "",
    phone: "",
    email: "",
  });

  const [jarvisForm, setJarvisForm] = useState({
    jarvis_enabled: true,
    jarvis_speed: 1.0,
    jarvis_pitch: 0.7,
    jarvis_volume: 1.0,
    jarvis_voice_gender: "male",
    jarvis_always_listening: false,
  });

  useEffect(() => {
    if (settings.id) {
      setForm({
        professional_name: String(settings.professional_name || ""),
        specialty: String(settings.specialty || ""),
        registration_number: String(settings.registration_number || ""),
        clinic_name: String(settings.clinic_name || ""),
        address: String(settings.address || ""),
        phone: String(settings.phone || ""),
        email: String(settings.email || ""),
      });
      setJarvisForm({
        jarvis_enabled: settings.jarvis_enabled !== false,
        jarvis_speed: Number(settings.jarvis_speed) || 1.0,
        jarvis_pitch: Number(settings.jarvis_pitch) || 0.7,
        jarvis_volume: Number(settings.jarvis_volume) || 1.0,
        jarvis_voice_gender: String(settings.jarvis_voice_gender || "male"),
        jarvis_always_listening: !!settings.jarvis_always_listening,
      });
    }
  }, [settings.id]);

  const handleTestVoice = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Olá, eu sou o Nando, seu assistente virtual.");
    utterance.lang = "pt-BR";
    utterance.rate = jarvisForm.jarvis_speed;
    utterance.pitch = jarvisForm.jarvis_pitch;
    utterance.volume = jarvisForm.jarvis_volume;
    const voices = window.speechSynthesis.getVoices();
    const ptVoices = voices.filter((v) => v.lang.startsWith("pt"));
    const maleKeywords = ["male", "masculin", "daniel", "ricardo", "marcos", "paulo", "jorge", "pedro", "google brasil", "microsoft daniel"];
    const femaleKeywords = ["female", "femin", "maria", "luciana", "francisca", "vitoria", "microsoft maria"];

    if (jarvisForm.jarvis_voice_gender === "male") {
      let voice: SpeechSynthesisVoice | undefined;
      for (const keyword of maleKeywords) {
        voice = ptVoices.find((v) => v.name.toLowerCase().includes(keyword));
        if (voice) break;
      }
      if (!voice) {
        const nonFemale = ptVoices.filter((v) => !femaleKeywords.some((k) => v.name.toLowerCase().includes(k)));
        voice = nonFemale[0] || ptVoices[0];
      }
      if (voice) utterance.voice = voice;
    } else {
      let voice: SpeechSynthesisVoice | undefined;
      for (const keyword of femaleKeywords) {
        voice = ptVoices.find((v) => v.name.toLowerCase().includes(keyword));
        if (voice) break;
      }
      if (!voice) voice = ptVoices[0];
      if (voice) utterance.voice = voice;
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = async () => {
    if (!settingsId) return;
    await update(settingsId, { ...form, ...jarvisForm });
    toast.success("Configurações salvas!");
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Sessão encerrada");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* Dados do Profissional */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados do Profissional</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome completo</Label>
                <Input value={form.professional_name} onChange={(e) => setForm({ ...form, professional_name: e.target.value })} placeholder="Dr(a). João Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Especialidade</Label>
                  <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Ex: Odontologia, Dermatologia, Clínica Geral..." />
                </div>
                <div className="grid gap-2">
                  <Label>Registro Profissional</Label>
                  <Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} placeholder="CRO, CRM, CRP, CREFITO..." />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">Dados da Clínica</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Nome da clínica</Label>
                <Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} placeholder="Clínica Sorriso" />
              </div>
              <div className="grid gap-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua Exemplo, 123" />
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

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      {/* Assistente Nando */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Assistente Nando</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="jarvis-toggle" className="text-sm text-muted-foreground">
                {jarvisForm.jarvis_enabled ? "Ativado" : "Desativado"}
              </Label>
              <Switch id="jarvis-toggle" checked={jarvisForm.jarvis_enabled} onCheckedChange={(checked) => setJarvisForm({ ...jarvisForm, jarvis_enabled: checked })} />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>Velocidade</Label><span className="text-sm text-muted-foreground">{jarvisForm.jarvis_speed.toFixed(1)}x</span></div>
              <Slider value={[jarvisForm.jarvis_speed]} onValueChange={([v]) => setJarvisForm({ ...jarvisForm, jarvis_speed: v })} min={0.5} max={2.0} step={0.1} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>Tom (grave ↔ agudo)</Label><span className="text-sm text-muted-foreground">{jarvisForm.jarvis_pitch.toFixed(1)}</span></div>
              <Slider value={[jarvisForm.jarvis_pitch]} onValueChange={([v]) => setJarvisForm({ ...jarvisForm, jarvis_pitch: v })} min={0.3} max={1.5} step={0.1} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>Volume</Label><span className="text-sm text-muted-foreground">{Math.round(jarvisForm.jarvis_volume * 100)}%</span></div>
              <Slider value={[jarvisForm.jarvis_volume]} onValueChange={([v]) => setJarvisForm({ ...jarvisForm, jarvis_volume: v })} min={0.1} max={1.0} step={0.05} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Estilo de Voz</Label>
            <div className="flex gap-3">
              <Button variant={jarvisForm.jarvis_voice_gender === "male" ? "default" : "outline"} className="flex-1" onClick={() => setJarvisForm({ ...jarvisForm, jarvis_voice_gender: "male" })}>🧑 Masculina</Button>
              <Button variant={jarvisForm.jarvis_voice_gender === "female" ? "default" : "outline"} className="flex-1" onClick={() => setJarvisForm({ ...jarvisForm, jarvis_voice_gender: "female" })}>👩 Feminina</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="always-listening">Escuta contínua</Label>
              <p className="text-xs text-muted-foreground">Nando fica ouvindo permanentemente</p>
            </div>
            <Switch id="always-listening" checked={jarvisForm.jarvis_always_listening} onCheckedChange={(checked) => setJarvisForm({ ...jarvisForm, jarvis_always_listening: checked })} />
          </div>

          <Button variant="outline" className="w-full" onClick={handleTestVoice}>
            <Volume2 className="h-4 w-4 mr-2" />Testar Voz
          </Button>
        </CardContent>
      </Card>

      {/* Conta */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Conta</h2>
          <p className="text-sm text-muted-foreground">
            Logado como: {profile?.full_name || "Usuário"}
          </p>
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />Sair da Conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
