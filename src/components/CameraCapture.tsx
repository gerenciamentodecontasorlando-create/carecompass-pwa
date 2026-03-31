import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, RotateCcw, Check, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_DIMENSION = 800;
const QUALITY = 0.5; // ~100KB per photo

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
            });
            resolve(compressed);
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        QUALITY
      );
    };
    img.src = url;
  });
}

export { compressImage };

export function CameraCapture({ onCapture, open, onOpenChange }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    try {
      // Stop previous stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      // Camera not available
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setPreview(null);
      setCapturedFile(null);
      setTimeout(() => startCamera(facingMode), 300);
    } else {
      stopCamera();
    }
    onOpenChange(isOpen);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        const raw = new File([blob], `foto_${Date.now()}.jpg`, { type: "image/jpeg" });
        const compressed = await compressImage(raw);
        setPreview(URL.createObjectURL(compressed));
        setCapturedFile(compressed);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const handleRetake = () => {
    setPreview(null);
    setCapturedFile(null);
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
    handleOpenChange(false);
  };

  const toggleCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capturar Foto Clínica
          </DialogTitle>
          <p className="text-xs text-muted-foreground">Compressão automática (~100KB por foto)</p>
        </DialogHeader>

        <div className="relative bg-black aspect-[4/3]">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="p-4 flex items-center justify-center gap-4">
          {preview ? (
            <>
              <Button variant="outline" onClick={handleRetake}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Refazer
              </Button>
              <Button onClick={handleConfirm}>
                <Check className="h-4 w-4 mr-2" />
                Usar foto
                {capturedFile && (
                  <span className="ml-1 text-xs opacity-70">
                    ({(capturedFile.size / 1024).toFixed(0)}KB)
                  </span>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="icon" onClick={toggleCamera}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button size="lg" className="rounded-full w-16 h-16" onClick={handleCapture}>
                <Camera className="h-6 w-6" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => handleOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
