import { AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MedicalAlertsProps {
  clinicalForm: {
    allergies: string;
    medical_history: string;
    current_medications: string;
  };
  clinical: Record<string, unknown> | null;
}

const ALERT_KEYWORDS: { keyword: string; label: string; severity: "critical" | "warning" }[] = [
  // Critical conditions
  { keyword: "alergia", label: "Alergia", severity: "critical" },
  { keyword: "alérgi", label: "Alergia", severity: "critical" },
  { keyword: "hemofilia", label: "Hemofilia", severity: "critical" },
  { keyword: "hemofíli", label: "Hemofilia", severity: "critical" },
  { keyword: "anticoagulante", label: "Anticoagulante", severity: "critical" },
  { keyword: "warfarin", label: "Warfarina", severity: "critical" },
  { keyword: "marcoumar", label: "Anticoagulante", severity: "critical" },
  { keyword: "heparina", label: "Heparina", severity: "critical" },
  { keyword: "transplant", label: "Transplantado", severity: "critical" },
  { keyword: "hiv", label: "HIV", severity: "critical" },
  { keyword: "hepatite", label: "Hepatite", severity: "critical" },
  // Warning conditions
  { keyword: "renal", label: "Doença Renal", severity: "warning" },
  { keyword: "diálise", label: "Diálise", severity: "critical" },
  { keyword: "dialise", label: "Diálise", severity: "critical" },
  { keyword: "diabetes", label: "Diabetes", severity: "warning" },
  { keyword: "diabétic", label: "Diabetes", severity: "warning" },
  { keyword: "insulina", label: "Insulina", severity: "warning" },
  { keyword: "hipertens", label: "Hipertensão", severity: "warning" },
  { keyword: "cardíac", label: "Cardiopatia", severity: "warning" },
  { keyword: "cardiac", label: "Cardiopatia", severity: "warning" },
  { keyword: "cardiopat", label: "Cardiopatia", severity: "warning" },
  { keyword: "marca-passo", label: "Marca-passo", severity: "critical" },
  { keyword: "marcapasso", label: "Marca-passo", severity: "critical" },
  { keyword: "epilepsia", label: "Epilepsia", severity: "warning" },
  { keyword: "convuls", label: "Convulsões", severity: "warning" },
  { keyword: "asma", label: "Asma", severity: "warning" },
  { keyword: "gestante", label: "Gestante", severity: "critical" },
  { keyword: "grávida", label: "Gestante", severity: "critical" },
  { keyword: "gravida", label: "Gestante", severity: "critical" },
  { keyword: "gestação", label: "Gestante", severity: "critical" },
  { keyword: "lactante", label: "Lactante", severity: "warning" },
  { keyword: "amamentando", label: "Lactante", severity: "warning" },
  { keyword: "quimioterapia", label: "Quimioterapia", severity: "critical" },
  { keyword: "radioterapia", label: "Radioterapia", severity: "critical" },
  { keyword: "câncer", label: "Câncer", severity: "critical" },
  { keyword: "cancer", label: "Câncer", severity: "critical" },
  { keyword: "lúpus", label: "Lúpus", severity: "warning" },
  { keyword: "lupus", label: "Lúpus", severity: "warning" },
];

export function MedicalAlerts({ clinicalForm, clinical }: MedicalAlertsProps) {
  const source = clinical ? clinicalForm : clinicalForm;
  const combined = [
    source.allergies,
    source.medical_history,
    source.current_medications,
  ].join(" ").toLowerCase();

  if (!combined.trim()) return null;

  const detected = new Map<string, "critical" | "warning">();

  for (const alert of ALERT_KEYWORDS) {
    if (combined.includes(alert.keyword.toLowerCase())) {
      const existing = detected.get(alert.label);
      if (!existing || alert.severity === "critical") {
        detected.set(alert.label, alert.severity);
      }
    }
  }

  // Also show raw allergy text if present
  const allergyText = source.allergies.trim();
  if (allergyText && !detected.has("Alergia")) {
    detected.set("Alergia", "critical");
  }

  if (detected.size === 0) return null;

  const sorted = [...detected.entries()].sort((a, b) => {
    if (a[1] === "critical" && b[1] !== "critical") return -1;
    if (a[1] !== "critical" && b[1] === "critical") return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
      <ShieldAlert className="h-5 w-5 text-destructive shrink-0" />
      <span className="text-sm font-semibold text-destructive mr-1">Alertas:</span>
      {sorted.map(([label, severity]) => (
        <Badge
          key={label}
          variant={severity === "critical" ? "destructive" : "outline"}
          className={
            severity === "critical"
              ? "gap-1"
              : "gap-1 border-warning text-warning bg-warning/10"
          }
        >
          <AlertTriangle className="h-3 w-3" />
          {label}
        </Badge>
      ))}
      {allergyText && (
        <span className="text-xs text-destructive/80 ml-1">
          ({allergyText.length > 60 ? allergyText.slice(0, 60) + "…" : allergyText})
        </span>
      )}
    </div>
  );
}
