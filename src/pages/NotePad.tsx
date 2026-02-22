import { useState, useRef, useCallback } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Printer, FileText, Save } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ indent: "-1" }, { indent: "+1" }],
    ["blockquote"],
    ["clean"],
  ],
};

const NotePad = () => {
  const { data: notes, insert, update, remove } = useClinicData("notes");
  const { data: settingsArr } = useClinicData("clinic_settings");
  const settings = settingsArr[0] || {};
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const handleSelect = (note: Record<string, unknown>) => {
    setSelectedId(String(note.id));
    setTitle(String(note.title || ""));
    setContent(String(note.content || ""));
  };

  const handleNew = async () => {
    if (!newTitle.trim()) { toast.error("Digite um título"); return; }
    const result = await insert({ title: newTitle.trim(), content: "" });
    if (result) {
      handleSelect(result);
      setNewTitle("");
      setNewOpen(false);
      toast.success("Nota criada");
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    await update(selectedId, { title, content });
    toast.success("Nota salva");
  };

  const handleDelete = async (id: string) => {
    await remove(id);
    if (selectedId === id) { setSelectedId(null); setTitle(""); setContent(""); }
    toast.success("Nota removida");
  };

  const handleGeneratePDF = useCallback(async () => {
    if (!printRef.current) return;
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`${title || "nota"}.pdf`);
      toast.success("PDF gerado!");
    } catch {
      toast.error("Erro ao gerar PDF");
    }
  }, [title]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-6rem)]">
      <div className="w-full lg:w-72 shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />Notas
          </h1>
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Nota</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Título da nota..." autoFocus />
                </div>
                <Button onClick={handleNew} className="w-full">Criar Nota</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma nota criada</p>
          ) : (
            notes.map((note) => (
              <Card
                key={String(note.id)}
                className={`cursor-pointer transition-shadow hover:shadow-md ${selectedId === String(note.id) ? "ring-2 ring-primary" : ""}`}
                onClick={() => handleSelect(note)}
              >
                <CardContent className="p-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{String(note.title)}</p>
                    <p className="text-xs text-muted-foreground">
                      {note.updated_at ? new Date(String(note.updated_at)).toLocaleDateString("pt-BR") : ""}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(String(note.id)); }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedId ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="text-lg font-semibold" />
              <Button onClick={handleSave} size="sm"><Save className="h-4 w-4 mr-1" />Salvar</Button>
              <Button onClick={handleGeneratePDF} variant="outline" size="sm"><Printer className="h-4 w-4 mr-1" />PDF</Button>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border bg-background">
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} className="h-full [&_.ql-container]:h-[calc(100%-42px)] [&_.ql-editor]:min-h-full" />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <FileText className="h-16 w-16 mx-auto opacity-30" />
              <p>Selecione ou crie uma nota</p>
            </div>
          </div>
        )}
      </div>

      {selectedId && (
        <div className="fixed left-[-9999px] top-0">
          <div ref={printRef} style={{ width: "794px", padding: "40px", fontFamily: "serif", background: "#fff" }}>
            <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "16px", marginBottom: "24px" }}>
              <h1 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>{String(settings.clinic_name || "Clínica")}</h1>
              <p style={{ fontSize: "12px", margin: "4px 0 0" }}>{String(settings.professional_name)} {settings.specialty && `— ${settings.specialty}`}</p>
              <p style={{ fontSize: "12px", margin: "2px 0 0" }}>{String(settings.registration_number || "")}</p>
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", marginBottom: "20px" }}>{title}</h2>
            <div dangerouslySetInnerHTML={{ __html: content }} style={{ fontSize: "13px", lineHeight: 1.8 }} />
            <div style={{ borderTop: "2px solid #000", paddingTop: "16px", marginTop: "40px", textAlign: "center", fontSize: "11px" }}>
              <p>{String(settings.address || "")}</p>
              <p>{[settings.phone, settings.email].filter(Boolean).join(" • ")}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotePad;
