interface ProfessionalStampProps {
  name: string;
  specialty: string;
  registrationNumber: string;
  showStamp?: boolean;
}

export function ProfessionalStamp({ name, specialty, registrationNumber, showStamp = true }: ProfessionalStampProps) {
  // Extract council prefix and number from registration (e.g. "CRO-SP 12345" → council="CRO-SP", number="12345")
  const parts = registrationNumber.trim().split(/\s+/);
  const council = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
  const number = parts.length > 1 ? parts[parts.length - 1] : registrationNumber;

  return (
    <div className="text-center relative">
      {/* Stamp overlay - positioned above the line */}
      {showStamp && name && (
        <div
          className="mx-auto mb-1 px-4 py-2 rounded-sm inline-block"
          style={{
            border: "1.5px solid hsl(var(--primary) / 0.35)",
            backgroundColor: "hsl(var(--primary) / 0.03)",
            minWidth: "180px",
            maxWidth: "240px",
          }}
        >
          <p className="text-[10px] font-bold tracking-wide uppercase leading-tight" style={{ color: "hsl(var(--primary) / 0.7)" }}>
            {name}
          </p>
          {specialty && (
            <p className="text-[8px] leading-tight mt-0.5" style={{ color: "hsl(var(--primary) / 0.55)" }}>
              {specialty}
            </p>
          )}
          {council && (
            <p className="text-[8px] leading-tight mt-0.5" style={{ color: "hsl(var(--primary) / 0.55)" }}>
              {council}
            </p>
          )}
          {number && (
            <p className="text-[8px] font-semibold leading-tight mt-0.5" style={{ color: "hsl(var(--primary) / 0.6)" }}>
              {number}
            </p>
          )}
        </div>
      )}
      {/* Signature line */}
      <div className="w-48 mx-auto mb-2" style={{ borderTop: "1px solid hsl(var(--foreground))" }} />
      <p className="text-sm font-semibold">{name || "Assinatura"}</p>
      <p className="text-xs text-muted-foreground">{registrationNumber || "Registro Profissional"}</p>
    </div>
  );
}
