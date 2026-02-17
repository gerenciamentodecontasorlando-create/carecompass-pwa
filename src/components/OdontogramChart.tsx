import React from "react";

interface OdontogramChartProps {
  onToothClick: (toothNumber: number) => void;
  selectedTooth: number | null;
  toothConditions: Record<number, string>;
}

const conditionColors: Record<string, string> = {
  healthy: "#34d399",
  cavity: "#ef4444",
  filling: "#0f766e",
  crown: "#f59e0b",
  missing: "#9ca3af",
  implant: "#065f53",
  root_canal: "#dc2626",
};

// Adult teeth numbers: Upper right 18-11, Upper left 21-28, Lower left 38-31, Lower right 41-48
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const ToothShape: React.FC<{
  x: number;
  y: number;
  toothNumber: number;
  isSelected: boolean;
  condition?: string;
  onClick: () => void;
  isMolar: boolean;
}> = ({ x, y, toothNumber, isSelected, condition, onClick, isMolar }) => {
  const fill = condition ? conditionColors[condition] || "#e5e7eb" : "#e5e7eb";
  const w = isMolar ? 38 : 28;
  const h = 40;

  return (
    <g onClick={onClick} className="cursor-pointer" role="button" tabIndex={0}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={fill}
        stroke={isSelected ? "#0f766e" : "#cbd5e1"}
        strokeWidth={isSelected ? 3 : 1.5}
        className="transition-all hover:opacity-80"
      />
      {condition === "missing" && (
        <>
          <line x1={x + 4} y1={y + 4} x2={x + w - 4} y2={y + h - 4} stroke="#fff" strokeWidth={2} />
          <line x1={x + w - 4} y1={y + 4} x2={x + 4} y2={y + h - 4} stroke="#fff" strokeWidth={2} />
        </>
      )}
      <text
        x={x + w / 2}
        y={y + h / 2 + 5}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill={condition && condition !== "healthy" ? "#fff" : "#374151"}
        className="select-none pointer-events-none"
      >
        {toothNumber}
      </text>
    </g>
  );
};

const OdontogramChart: React.FC<OdontogramChartProps> = ({
  onToothClick,
  selectedTooth,
  toothConditions,
}) => {
  const isMolar = (n: number) => {
    const unit = n % 10;
    return unit >= 4;
  };

  const getX = (teeth: number[], index: number) => {
    let x = 10;
    for (let i = 0; i < index; i++) {
      x += (isMolar(teeth[i]) ? 38 : 28) + 4;
    }
    return x;
  };

  const totalWidth = (teeth: number[]) => {
    return teeth.reduce((sum, t) => sum + (isMolar(t) ? 38 : 28) + 4, 0) + 16;
  };

  const svgWidth = Math.max(totalWidth(upperTeeth), totalWidth(lowerTeeth));

  return (
    <div className="overflow-x-auto">
      <svg width={svgWidth} height={170} viewBox={`0 0 ${svgWidth} 170`} className="mx-auto">
        {/* Labels */}
        <text x={svgWidth / 4} y={15} textAnchor="middle" fontSize={10} fill="#9ca3af" fontWeight={600}>
          SUPERIOR DIREITO
        </text>
        <text x={(svgWidth * 3) / 4} y={15} textAnchor="middle" fontSize={10} fill="#9ca3af" fontWeight={600}>
          SUPERIOR ESQUERDO
        </text>

        {/* Upper teeth */}
        {upperTeeth.map((tooth, i) => (
          <ToothShape
            key={tooth}
            x={getX(upperTeeth, i)}
            y={22}
            toothNumber={tooth}
            isSelected={selectedTooth === tooth}
            condition={toothConditions[tooth]}
            onClick={() => onToothClick(tooth)}
            isMolar={isMolar(tooth)}
          />
        ))}

        {/* Divider line */}
        <line x1={10} y1={72} x2={svgWidth - 10} y2={72} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4" />

        {/* Lower teeth */}
        {lowerTeeth.map((tooth, i) => (
          <ToothShape
            key={tooth}
            x={getX(lowerTeeth, i)}
            y={80}
            toothNumber={tooth}
            isSelected={selectedTooth === tooth}
            condition={toothConditions[tooth]}
            onClick={() => onToothClick(tooth)}
            isMolar={isMolar(tooth)}
          />
        ))}

        <text x={svgWidth / 4} y={140} textAnchor="middle" fontSize={10} fill="#9ca3af" fontWeight={600}>
          INFERIOR DIREITO
        </text>
        <text x={(svgWidth * 3) / 4} y={140} textAnchor="middle" fontSize={10} fill="#9ca3af" fontWeight={600}>
          INFERIOR ESQUERDO
        </text>
      </svg>
    </div>
  );
};

export default OdontogramChart;
