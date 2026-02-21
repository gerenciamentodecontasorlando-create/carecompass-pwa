import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, Trash2 } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  patientName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  notes: string;
  procedure: string;
  dentist: string;
}

const Agenda = () => {
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>("appointments", []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ patientName: "", time: "09:00", type: "Consulta", notes: "", procedure: "", dentist: "" });

  const dayAppointments = appointments
    .filter((a) => isSameDay(parseISO(a.date), selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time));

  const datesWithAppointments = appointments.map((a) => parseISO(a.date));

  const handleAdd = () => {
    if (!form.patientName.trim()) { toast.error("Nome do paciente é obrigatório"); return; }
    const appt: Appointment = {
      id: crypto.randomUUID(),
      patientName: form.patientName,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: form.time,
      type: form.type,
      status: "agendado",
      notes: form.notes,
      procedure: form.procedure,
      dentist: form.dentist,
    };
    setAppointments((prev) => [...prev, appt]);
    setForm({ patientName: "", time: "09:00", type: "Consulta", notes: "", procedure: "", dentist: "" });
    setOpen(false);
    toast.success("Consulta agendada");
  };

  const handleDelete = (id: string) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    toast.success("Consulta removida");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Consulta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Consulta — {format(selectedDate, "dd/MM/yyyy")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Paciente *</Label>
                <Input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Horário</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                      <SelectItem value="Retorno">Retorno</SelectItem>
                      <SelectItem value="Procedimento">Procedimento</SelectItem>
                      <SelectItem value="Avaliação">Avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Procedimento / Palavras-chave</Label>
                <Input value={form.procedure} onChange={(e) => setForm({ ...form, procedure: e.target.value })} placeholder="Ex: Extração, Limpeza, Canal, Restauração..." />
              </div>
              <div className="grid gap-2">
                <Label>Dentista responsável</Label>
                <Input value={form.dentist} onChange={(e) => setForm({ ...form, dentist: e.target.value })} placeholder="Dr(a). nome do profissional" />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button onClick={handleAdd} className="w-full">Agendar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={ptBR}
              className="pointer-events-auto"
              modifiers={{ hasAppointment: datesWithAppointments }}
              modifiersClassNames={{ hasAppointment: "bg-primary/20 font-bold" }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "dd 'de' MMMM, EEEE", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dayAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma consulta neste dia.</p>
            ) : (
              <div className="space-y-3">
                {dayAppointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-primary font-semibold text-sm min-w-[60px]">
                        <Clock className="h-3.5 w-3.5" />
                        {a.time}
                      </div>
                      <div>
                        <p className="font-medium">{a.patientName}</p>
                        <p className="text-xs text-muted-foreground">{a.type}{a.procedure ? ` • ${a.procedure}` : ""}</p>
                        {a.dentist && <p className="text-xs text-muted-foreground">🦷 {a.dentist}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Agenda;
