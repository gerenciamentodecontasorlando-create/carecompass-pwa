import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  label?: string;
}

export function SignaturePad({
  value,
  onChange,
  width = 400,
  height = 160,
  label = "Assinatura do Paciente",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  // Restore saved signature
  useEffect(() => {
    if (!value || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0);
      setHasContent(true);
    };
    img.src = value;
  }, [value]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDraw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      setIsDrawing(true);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    },
    [getPos]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { x, y } = getPos(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1a1a1a";
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasContent(true);
    },
    [isDrawing, getPos]
  );

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasContent(false);
    onChange(null);
  };

  const save = () => {
    if (!canvasRef.current || !hasContent) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    onChange(dataUrl);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-1 bg-background">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full cursor-crosshair touch-none rounded"
          style={{ maxHeight: `${height}px` }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear} disabled={!hasContent}>
          <Eraser className="h-3.5 w-3.5 mr-1" />Limpar
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={!hasContent}>
          <Check className="h-3.5 w-3.5 mr-1" />Confirmar Assinatura
        </Button>
      </div>
    </div>
  );
}
