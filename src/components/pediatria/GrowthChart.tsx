import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot,
} from "recharts";
import type { LMSRow } from "@/lib/whoGrowthData";
import { interpolateLMS } from "@/lib/whoZScore";

interface Props {
  table: LMSRow[];
  patientPoints: Array<{ ageMonths: number; value: number }>;
  unit: string;
  title: string;
  yLabel: string;
}

// Z-scores for percentile reference curves
const REF_LINES = [
  { key: "p3", z: -1.881, color: "hsl(var(--destructive))", label: "P3" },
  { key: "p15", z: -1.036, color: "hsl(var(--muted-foreground))", label: "P15" },
  { key: "p50", z: 0, color: "hsl(var(--primary))", label: "P50" },
  { key: "p85", z: 1.036, color: "hsl(var(--muted-foreground))", label: "P85" },
  { key: "p97", z: 1.881, color: "hsl(var(--destructive))", label: "P97" },
];

function computeFromZ(lms: { L: number; M: number; S: number }, z: number): number {
  const { L, M, S } = lms;
  if (L === 0) return M * Math.exp(S * z);
  return M * Math.pow(1 + L * S * z, 1 / L);
}

export function GrowthChart({ table, patientPoints, unit, title, yLabel }: Props) {
  const data = useMemo(() => {
    const minAge = table[0].age;
    const maxAge = table[table.length - 1].age;
    const step = maxAge <= 60 ? 1 : 6;
    const points = [];
    for (let age = minAge; age <= maxAge; age += step) {
      const lms = interpolateLMS(age, table);
      if (!lms) continue;
      const row: Record<string, number> = { age };
      for (const r of REF_LINES) row[r.key] = +computeFromZ(lms, r.z).toFixed(2);
      points.push(row);
    }
    return points;
  }, [table]);

  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="age" label={{ value: "Idade (meses)", position: "insideBottom", offset: -2, fontSize: 11 }} fontSize={11} />
          <YAxis label={{ value: `${yLabel} (${unit})`, angle: -90, position: "insideLeft", fontSize: 11 }} fontSize={11} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {REF_LINES.map((r) => (
            <Line
              key={r.key}
              type="monotone"
              dataKey={r.key}
              stroke={r.color}
              strokeWidth={r.key === "p50" ? 2 : 1}
              strokeDasharray={r.key === "p3" || r.key === "p97" ? "4 4" : undefined}
              dot={false}
              name={r.label}
            />
          ))}
          {patientPoints.map((p, i) => (
            <ReferenceDot
              key={i}
              x={p.ageMonths}
              y={p.value}
              r={5}
              fill="hsl(var(--accent-foreground))"
              stroke="hsl(var(--background))"
              strokeWidth={2}
              label={{ value: i === patientPoints.length - 1 ? "Atual" : "", position: "top", fontSize: 10 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
