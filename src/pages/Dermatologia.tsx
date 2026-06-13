import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Syringe, Sun, Printer, Plus, Trash2, FileText, Scissors } from "lucide-react";
import { toast } from "sonner";
import { BiopsiaForm } from "@/components/derma/BiopsiaForm";

const FITZPATRICK = [
  { id: "I", color: "#f5d5b5", desc: "Branco lácteo - sempre queima, nunca bronzeia" },
  { id: "II", color: "#e8c39e", desc: "Branco - quase sempre queima, bronzeia pouco" },
  { id: "III", color: "#d2a679", desc: "Moreno claro - queima moderado, bronzeia gradual" },
  { id: "IV", color: "#a87554", desc: "Moreno - queima pouco, sempre bronzeia" },
  { id: "V", color: "#7a4f31", desc: "Pardo - raramente queima, bronzeia muito" },
  { id: "VI", color: "#3d241a", desc: "Negro - nunca queima, totalmente pigmentado" },
];

const TIPOS_LESAO = [
  "Mácula", "Pápula", "Placa", "Nódulo", "Vesícula", "Bolha", "Pústula",
  "Crosta", "Escama", "Erosão", "Úlcera", "Cicatriz", "Telangiectasia",
  "Comedão", "Cisto", "Tumor", "Atrofia", "Liquenificação"
];

const REGIOES = [
  "Couro cabeludo", "Face (testa)", "Face (malar)", "Face (mento)",
  "Pálpebras", "Pavilhão auricular", "Pescoço", "Tórax anterior",
  "Tórax posterior (dorso)", "Abdome", "Membros superiores", "Mãos",
  "Membros inferiores", "Pés", "Genitais", "Região glútea"
];

const PROTOCOLOS: Record<string, string> = {
  "acne": `## Acne Vulgar - Protocolo (Diretrizes SBD)

**Avaliação:**
- Grau I (comedoniana): comedões abertos/fechados
- Grau II (papulopustulosa): + pápulas e pústulas
- Grau III (nódulo-cística): + nódulos
- Grau IV (conglobata): abscessos e fístulas

**Conduta:**
1. **Higiene:** sabonete suave (ácido salicílico/glicólico) 2x/dia
2. **Tópico:**
   - Adapaleno 0,1% gel - 1x/noite
   - Peróxido de benzoíla 5% - manhã
   - Clindamicina 1% gel se inflamação
3. **Sistêmico (Grau II-IV):**
   - Doxiciclina 100mg/dia VO por 8-12 semanas
   - Isotretinoína 0,5-1mg/kg/dia (Grau III-IV ou refratária)
4. **Fotoproteção** obrigatória (oil-free)
5. Reavaliação em 8 semanas`,

  "melasma": `## Melasma - Protocolo

**Avaliação:** Wood, fotos padronizadas, MASI score

**Conduta:**
1. **Fotoproteção rigorosa:** FPS ≥50 com cor (FeOx), reaplicar 3x/dia
2. **Despigmentantes tópicos:**
   - Hidroquinona 4% noite (até 6 meses)
   - Tríplice de Kligman (HQ4% + Tretinoína 0,05% + Hidrocortisona 1%) - 8 semanas
   - Ácido tranexâmico tópico 5% - manhã
3. **Sistêmico:** Ácido tranexâmico 250mg VO 2x/dia por 3-6 meses (avaliar contraindicações)
4. **Procedimentos:** peelings superficiais (mandélico 30%, glicólico 35%), microagulhamento
5. Evitar lasers ablativos (rebote)`,

  "rosacea": `## Rosácea - Protocolo

**Subtipos:** eritêmato-telangiectásica, papulopustulosa, fimatosa, ocular

**Conduta:**
1. **Identificar e evitar gatilhos** (calor, álcool, alimentos picantes, estresse)
2. **Cuidados:** limpeza suave, hidratação, FPS ≥50 mineral
3. **Tópico:**
   - Metronidazol 0,75% gel/creme 2x/dia
   - Ivermectina 1% creme 1x/dia (papulopustulosa)
   - Brimonidina 0,33% gel (eritema)
4. **Sistêmico:**
   - Doxiciclina 40mg liberação modificada 1x/dia (3 meses)
   - Isotretinoína 10-20mg/dia em casos refratários
5. **Procedimentos:** Luz Pulsada (IPL), laser vascular`,

  "alopecia": `## Alopecia Androgenética - Protocolo

**Diagnóstico:** Ludwig (♀) ou Hamilton-Norwood (♂), tricoscopia

**Conduta:**
1. **Tópico:**
   - Minoxidil 5% solução/foam - 1mL 2x/dia
   - Latanoprosta 0,005% (sobrancelhas)
2. **Sistêmico:**
   - Finasterida 1mg/dia VO (♂)
   - Espironolactona 100-200mg/dia (♀, off-label)
   - Dutasterida 0,5mg/dia (refratários)
3. **Procedimentos:**
   - Microagulhamento 1-1,5mm a cada 4 semanas
   - PRP (5 sessões mensais + manutenção trimestral)
   - LLLT (laser de baixa intensidade)
4. Suplementação: biotina, zinco, ferro, vit D se deficiência`,
};

const PROCEDIMENTOS_ESTETICOS = [
  { id: "btx", label: "Toxina Botulínica" },
  { id: "preench", label: "Preenchimento (Ácido Hialurônico)" },
  { id: "peeling", label: "Peeling Químico" },
  { id: "laser", label: "Laser / IPL" },
  { id: "microagulha", label: "Microagulhamento" },
  { id: "criofrequencia", label: "Criofrequência / Radiofrequência" },
];

type ProcedimentoRegistro = {
  id: string;
  data: string;
  tipo: string;
  area: string;
  produto: string;
  lote: string;
  dose: string;
  obs: string;
};

const Dermatologia = () => {
  const [fototipo, setFototipo] = useState("III");
  const [lesoes, setLesoes] = useState<Array<{ tipo: string; regiao: string; descricao: string }>>([
    { tipo: "", regiao: "", descricao: "" }
  ]);
  const [protocolo, setProtocolo] = useState("acne");
  const [procRegs, setProcRegs] = useState<ProcedimentoRegistro[]>([]);
  const [novoProc, setNovoProc] = useState<ProcedimentoRegistro>({
    id: "", data: new Date().toISOString().slice(0, 10), tipo: "btx",
    area: "", produto: "", lote: "", dose: "", obs: "",
  });

  const addLesao = () => setLesoes([...lesoes, { tipo: "", regiao: "", descricao: "" }]);
  const removeLesao = (i: number) => setLesoes(lesoes.filter((_, idx) => idx !== i));

  const addProc = () => {
    if (!novoProc.area || !novoProc.produto) {
      toast.error("Preencha área e produto");
      return;
    }
    setProcRegs([{ ...novoProc, id: crypto.randomUUID() }, ...procRegs]);
    setNovoProc({ ...novoProc, area: "", produto: "", lote: "", dose: "", obs: "" });
    toast.success("Procedimento registrado");
  };

  const printFicha = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    const lesoesText = lesoes.filter(l => l.tipo).map((l, i) =>
      `${i + 1}. ${l.tipo} - ${l.regiao}: ${l.descricao}`
    ).join("\n");
    w.document.write(`<html><head><title>Ficha Dermatológica</title>
      <style>body{font-family:Arial;padding:30px;line-height:1.6}h1{color:#0f766e}h2{color:#115e59;margin-top:20px}</style>
      </head><body>
      <h1>Ficha Dermatológica</h1>
      <h2>Fototipo Fitzpatrick</h2><p>${fototipo} - ${FITZPATRICK.find(f => f.id === fototipo)?.desc}</p>
      <h2>Lesões</h2><pre style="white-space:pre-wrap;font-family:Arial">${lesoesText}</pre>
      </body></html>`);
    w.document.close();
    w.print();
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Dermatologia / Estética</h1>
          <p className="text-sm text-muted-foreground">
            Ficha dermatológica, procedimentos estéticos, protocolos SBD e receituário cosmético
          </p>
        </div>
      </div>

      <Tabs defaultValue="ficha">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="ficha"><FileText className="h-4 w-4 mr-1" />Ficha</TabsTrigger>
          <TabsTrigger value="cirurgias"><Scissors className="h-4 w-4 mr-1" />Cirurgias / Biópsias</TabsTrigger>
          <TabsTrigger value="procedimentos"><Syringe className="h-4 w-4 mr-1" />Procedimentos</TabsTrigger>
          <TabsTrigger value="protocolos"><Sun className="h-4 w-4 mr-1" />Protocolos</TabsTrigger>
          <TabsTrigger value="rx"><Sparkles className="h-4 w-4 mr-1" />Receituário</TabsTrigger>
        </TabsList>

        {/* PEQUENAS CIRURGIAS / BIÓPSIAS */}
        <TabsContent value="cirurgias" className="space-y-4">
          <BiopsiaForm />
        </TabsContent>

        {/* FICHA */}
        <TabsContent value="ficha" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Fototipo (Fitzpatrick)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {FITZPATRICK.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFototipo(f.id)}
                    className={`p-3 rounded-lg border-2 transition ${fototipo === f.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                  >
                    <div className="w-full h-10 rounded mb-2" style={{ background: f.color }} />
                    <div className="font-bold text-sm">Tipo {f.id}</div>
                    <div className="text-xs text-muted-foreground">{f.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Mapa de Lesões</CardTitle>
                <Button size="sm" onClick={addLesao}><Plus className="h-4 w-4 mr-1" />Lesão</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lesoes.map((l, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-l-4 border-primary/40 pl-3">
                  <div className="md:col-span-3">
                    <Label className="text-xs">Tipo</Label>
                    <Select value={l.tipo} onValueChange={(v) => {
                      const next = [...lesoes]; next[i].tipo = v; setLesoes(next);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{TIPOS_LESAO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <Label className="text-xs">Região</Label>
                    <Select value={l.regiao} onValueChange={(v) => {
                      const next = [...lesoes]; next[i].regiao = v; setLesoes(next);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{REGIOES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-5">
                    <Label className="text-xs">Descrição (cor, tamanho, bordas, evolução)</Label>
                    <Input value={l.descricao} onChange={(e) => {
                      const next = [...lesoes]; next[i].descricao = e.target.value; setLesoes(next);
                    }} />
                  </div>
                  <div className="md:col-span-1">
                    <Button size="icon" variant="ghost" onClick={() => removeLesao(i)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button onClick={printFicha} className="mt-2"><Printer className="h-4 w-4 mr-1" />Imprimir ficha</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROCEDIMENTOS */}
        <TabsContent value="procedimentos" className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Registrar procedimento estético</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={novoProc.data} onChange={(e) => setNovoProc({ ...novoProc, data: e.target.value })} />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={novoProc.tipo} onValueChange={(v) => setNovoProc({ ...novoProc, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROCEDIMENTOS_ESTETICOS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Área(s) tratada(s)</Label>
                  <Input value={novoProc.area} onChange={(e) => setNovoProc({ ...novoProc, area: e.target.value })} placeholder="Ex: glabela, frontal" />
                </div>
                <div>
                  <Label>Produto / Marca</Label>
                  <Input value={novoProc.produto} onChange={(e) => setNovoProc({ ...novoProc, produto: e.target.value })} />
                </div>
                <div>
                  <Label>Lote / Validade</Label>
                  <Input value={novoProc.lote} onChange={(e) => setNovoProc({ ...novoProc, lote: e.target.value })} />
                </div>
                <div>
                  <Label>Dose / Quantidade</Label>
                  <Input value={novoProc.dose} onChange={(e) => setNovoProc({ ...novoProc, dose: e.target.value })} placeholder="Ex: 20U / 1mL" />
                </div>
              </div>
              <Textarea placeholder="Observações" value={novoProc.obs} onChange={(e) => setNovoProc({ ...novoProc, obs: e.target.value })} />
              <Button onClick={addProc}><Plus className="h-4 w-4 mr-1" />Registrar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico ({procRegs.length})</CardTitle></CardHeader>
            <CardContent>
              {procRegs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum procedimento registrado.</p>
              ) : (
                <div className="space-y-2">
                  {procRegs.map((p) => (
                    <div key={p.id} className="border rounded p-3 text-sm">
                      <div className="flex justify-between">
                        <strong>{PROCEDIMENTOS_ESTETICOS.find(x => x.id === p.tipo)?.label}</strong>
                        <span className="text-muted-foreground">{p.data}</span>
                      </div>
                      <div>Área: {p.area} | Produto: {p.produto} | Lote: {p.lote} | Dose: {p.dose}</div>
                      {p.obs && <div className="text-muted-foreground mt-1">{p.obs}</div>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROTOCOLOS */}
        <TabsContent value="protocolos">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.keys(PROTOCOLOS).map((k) => (
                  <Button key={k} size="sm" variant={protocolo === k ? "default" : "outline"} onClick={() => setProtocolo(k)}>
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </Button>
                ))}
              </div>
              <Textarea value={PROTOCOLOS[protocolo]} readOnly rows={20} className="font-mono text-xs" />
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(PROTOCOLOS[protocolo]); toast.success("Copiado"); }}>
                Copiar protocolo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rx">
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <Sparkles className="h-12 w-12 mx-auto text-primary" />
              <p className="text-sm">
                As medicações dermatológicas e cosméticas foram adicionadas ao Receituário.
              </p>
              <Button asChild><a href="/receituario">Abrir Receituário</a></Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dermatologia;
