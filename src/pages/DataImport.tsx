import { useState, useRef } from "react";
import { useClinicData } from "@/hooks/useClinicData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, Users, AlertTriangle, CheckCircle2, Download } from "lucide-react";

interface ImportResult {
  total: number;
  success: number;
  errors: string[];
}

const DataImport = () => {
  const { insert: insertPatient } = useClinicData("patients");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];
    
    // Detect separator
    const sep = lines[0].includes(";") ? ";" : ",";
    const headers = lines[0].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
    
    return lines.slice(1).map((line) => {
      const values = line.split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    });
  };

  const FIELD_MAP: Record<string, string[]> = {
    name: ["nome", "name", "paciente", "patient", "nome_completo", "nome completo", "full_name"],
    phone: ["telefone", "phone", "tel", "celular", "fone", "whatsapp"],
    email: ["email", "e-mail", "e_mail"],
    cpf: ["cpf", "documento", "doc"],
    birth_date: ["nascimento", "data_nascimento", "birth_date", "data nascimento", "dt_nasc", "nasc"],
    address: ["endereco", "endereço", "address", "end"],
    notes: ["observacao", "observações", "obs", "notes", "notas", "anotacao"],
  };

  const mapField = (headers: string[], targetField: string): string | null => {
    const aliases = FIELD_MAP[targetField] || [];
    return headers.find((h) => aliases.includes(h.toLowerCase())) || null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error("Formato não suportado. Use arquivo CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("Arquivo vazio ou formato inválido.");
        return;
      }
      setPreview(rows);
      setResult(null);
      toast.success(`${rows.length} registros encontrados. Revise e confirme a importação.`);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    const headers = Object.keys(preview[0]);
    const nameField = mapField(headers, "name");

    if (!nameField) {
      toast.error("Coluna 'nome' não encontrada. Verifique o CSV.");
      setImporting(false);
      return;
    }

    let success = 0;
    const errors: string[] = [];

    for (const row of preview) {
      const name = row[nameField]?.trim();
      if (!name) { errors.push("Linha sem nome — ignorada"); continue; }

      const patient: Record<string, string> = { name };
      
      const phoneField = mapField(headers, "phone");
      if (phoneField && row[phoneField]) patient.phone = row[phoneField];
      
      const emailField = mapField(headers, "email");
      if (emailField && row[emailField]) patient.email = row[emailField];
      
      const cpfField = mapField(headers, "cpf");
      if (cpfField && row[cpfField]) patient.cpf = row[cpfField];
      
      const birthField = mapField(headers, "birth_date");
      if (birthField && row[birthField]) patient.birth_date = row[birthField];
      
      const addressField = mapField(headers, "address");
      if (addressField && row[addressField]) patient.address = row[addressField];
      
      const notesField = mapField(headers, "notes");
      if (notesField && row[notesField]) patient.notes = row[notesField];

      const result = await insertPatient(patient);
      if (result) {
        success++;
      } else {
        errors.push(`Erro ao importar: ${name}`);
      }
    }

    setResult({ total: preview.length, success, errors });
    setImporting(false);
    if (success > 0) toast.success(`${success} pacientes importados com sucesso!`);
    if (errors.length > 0) toast.error(`${errors.length} erros durante a importação`);
  };

  const downloadTemplate = () => {
    const csv = "nome;telefone;email;cpf;nascimento;endereco;observacao\nJoão Silva;(11)99999-0000;joao@email.com;123.456.789-00;1985-03-15;Rua Exemplo 123;Paciente novo\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_importacao_pacientes.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar Dados</h1>
        <p className="text-sm text-muted-foreground">Importe pacientes de outro software via arquivo CSV</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Pacientes (CSV)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium">Como preparar seu arquivo:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Exporte os dados do seu software atual em formato <strong>CSV</strong></li>
              <li>A primeira linha deve conter os nomes das colunas</li>
              <li>Colunas reconhecidas: <code>nome</code>, <code>telefone</code>, <code>email</code>, <code>cpf</code>, <code>nascimento</code>, <code>endereço</code>, <code>observação</code></li>
              <li>Separador: vírgula (,) ou ponto-e-vírgula (;)</li>
            </ul>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => fileRef.current?.click()} variant="outline">
              <Upload className="h-4 w-4 mr-2" />Selecionar Arquivo CSV
            </Button>
            <Button onClick={downloadTemplate} variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />Baixar Modelo CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv,.txt" className="sr-only" onChange={handleFileSelect} />
          </div>

          {/* Preview */}
          {preview.length > 0 && !result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" />{preview.length} registros
                </Badge>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? "Importando..." : `Importar ${preview.length} Pacientes`}
                </Button>
              </div>
              <div className="border rounded-lg overflow-x-auto max-h-60">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(preview[0]).slice(0, 6).map((h) => (
                        <th key={h} className="text-left p-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t">
                        {Object.keys(preview[0]).slice(0, 6).map((h) => (
                          <td key={h} className="p-2 truncate max-w-[150px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-muted-foreground p-2">... e mais {preview.length - 10} registros</p>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span><strong>{result.success}</strong> importados</span>
                </div>
                {result.errors.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span><strong>{result.errors.length}</strong> erros</span>
                  </div>
                )}
              </div>
              {result.errors.length > 0 && (
                <div className="bg-destructive/10 rounded-lg p-3 text-xs space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => { setPreview([]); setResult(null); }}>
                Nova Importação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataImport;
