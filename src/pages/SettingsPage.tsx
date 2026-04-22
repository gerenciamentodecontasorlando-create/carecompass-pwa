import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useClinicData } from "@/hooks/useClinicData";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, LogOut, Volume2, RefreshCw, Globe } from "lucide-react";

const SettingsPage = () => {
  const { t, i18n } = useTranslation();
  const { signOut, profile } = useAuth();
  const { data: settingsArr, update } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const settingsId = String(settings.id || "");

  const currentLang = i18n.language?.startsWith("es") ? "es" : "pt";

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
    const testText = currentLang === "es"
      ? "Hola, soy Roma, su asistente virtual."
      : "Olá, eu sou o Roma, seu assistente virtual.";
    const utterance = new SpeechSynthesisUtterance(testText);
    utterance.lang = currentLang === "es" ? "es-ES" : "pt-BR";
    utterance.rate = jarvisForm.jarvis_speed;
    utterance.pitch = jarvisForm.jarvis_pitch;
    utterance.volume = jarvisForm.jarvis_volume;
    const voices = window.speechSynthesis.getVoices();
    const langVoices = voices.filter((v) => v.lang.startsWith(currentLang === "es" ? "es" : "pt"));
    if (langVoices[0]) utterance.voice = langVoices[0];
    window.speechSynthesis.speak(utterance);
  };

  const handleSave = async () => {
    if (!settingsId) return;
    await update(settingsId, { ...form, ...jarvisForm });
    toast.success(t("settings.saved"));
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t("settings.loggedOut"));
  };

  const toggleLanguage = () => {
    const newLang = currentLang === "pt" ? "es" : "pt";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {/* Idioma */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">{t("settings.language")}</h2>
              </div>
            </div>
            <Button variant="outline" onClick={toggleLanguage} className="flex items-center gap-2">
              {currentLang === "pt" ? "🇧🇷 Português" : "🇪🇸 Español"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Profissional */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">{t("settings.professionalData")}</h2>
            <p className="text-xs text-muted-foreground mb-4 p-3 rounded-md bg-muted/50 border border-border">
              {t("settings.multiSpecialtyNote")}
            </p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t("settings.fullName")}</Label>
                <Input value={form.professional_name} onChange={(e) => setForm({ ...form, professional_name: e.target.value })} placeholder={t("settings.fullNamePlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("settings.specialty")}</Label>
                  <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder={t("settings.specialtyPlaceholder")} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("settings.registration")}</Label>
                  <Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} placeholder={t("settings.registrationPlaceholder")} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold mb-4">{t("settings.clinicData")}</h2>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>{t("settings.clinicName")}</Label>
                <Input value={form.clinic_name} onChange={(e) => setForm({ ...form, clinic_name: e.target.value })} placeholder={t("settings.clinicNamePlaceholder")} />
              </div>
              <div className="grid gap-2">
                <Label>{t("settings.address")}</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder={t("settings.addressPlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("settings.phone")}</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={t("settings.phonePlaceholder")} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("settings.email")}</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("settings.emailPlaceholder")} />
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />{t("settings.save")}
          </Button>
        </CardContent>
      </Card>

      {/* Assistente Roma */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("settings.roma")}</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="jarvis-toggle" className="text-sm text-muted-foreground">
                {jarvisForm.jarvis_enabled ? t("settings.enabled") : t("settings.disabled")}
              </Label>
              <Switch id="jarvis-toggle" checked={jarvisForm.jarvis_enabled} onCheckedChange={(checked) => setJarvisForm({ ...jarvisForm, jarvis_enabled: checked })} />
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>{t("settings.speed")}</Label><span className="text-sm text-muted-foreground">{jarvisForm.jarvis_speed.toFixed(1)}x</span></div>
              <Slider value={[jarvisForm.jarvis_speed]} onValueChange={([v]) => setJarvisForm({ ...jarvisForm, jarvis_speed: v })} min={0.5} max={2.0} step={0.1} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>{t("settings.pitch")}</Label><span className="text-sm text-muted-foreground">{jarvisForm.jarvis_pitch.toFixed(1)}</span></div>
              <Slider value={[jarvisForm.jarvis_pitch]} onValueChange={([v]) => setJarvisForm({ ...jarvisForm, jarvis_pitch: v })} min={0.3} max={1.5} step={0.1} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between"><Label>{t("settings.volume")}</Label><span className="text-sm text-muted-foreground">{Math.round(jarvisForm.jarvis_volume * 100)}%</span></div>
              <Slider value={[jarvisForm.jarvis_volume]} onValueChange={([v]) => setJarvisForm({ ...jarvisForm, jarvis_volume: v })} min={0.1} max={1.0} step={0.05} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{t("settings.voiceStyle")}</Label>
            <div className="flex gap-3">
              <Button variant={jarvisForm.jarvis_voice_gender === "male" ? "default" : "outline"} className="flex-1" onClick={() => setJarvisForm({ ...jarvisForm, jarvis_voice_gender: "male" })}>{t("settings.male")}</Button>
              <Button variant={jarvisForm.jarvis_voice_gender === "female" ? "default" : "outline"} className="flex-1" onClick={() => setJarvisForm({ ...jarvisForm, jarvis_voice_gender: "female" })}>{t("settings.female")}</Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="always-listening">{t("settings.continuousListening")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.continuousListeningDesc")}</p>
            </div>
            <Switch id="always-listening" checked={jarvisForm.jarvis_always_listening} onCheckedChange={(checked) => setJarvisForm({ ...jarvisForm, jarvis_always_listening: checked })} />
          </div>

          <Button variant="outline" className="w-full" onClick={handleTestVoice}>
            <Volume2 className="h-4 w-4 mr-2" />{t("settings.testVoice")}
          </Button>
        </CardContent>
      </Card>

      {/* Atualizar App */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("settings.update")}</h2>
          <p className="text-sm text-muted-foreground">{t("settings.updateDesc")}</p>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              try {
                if ("serviceWorker" in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  await Promise.all(registrations.map((r) => r.unregister()));
                }
                if ("caches" in window) {
                  const keys = await caches.keys();
                  await Promise.all(keys.map((k) => caches.delete(k)));
                }
                toast.success(t("settings.cacheCleared"));
                setTimeout(() => window.location.reload(), 800);
              } catch {
                window.location.reload();
              }
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />{t("settings.updateBtn")}
          </Button>
        </CardContent>
      </Card>

      {/* Conta */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t("settings.account")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("settings.loggedAs")} {profile?.full_name || t("common.user")}
          </p>
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />{t("settings.logoutBtn")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
