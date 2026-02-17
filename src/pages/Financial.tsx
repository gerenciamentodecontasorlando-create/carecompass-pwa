import { useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense";
  amount: number;
  category: string;
}

const categories = {
  income: ["Consulta", "Procedimento", "Convênio", "Outro"],
  expense: ["Material", "Aluguel", "Funcionário", "Equipamento", "Impostos", "Outro"],
};

const Financial = () => {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("transactions", []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", type: "income" as "income" | "expense", amount: "", category: "Consulta", date: format(new Date(), "yyyy-MM-dd") });
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "yyyy-MM"));

  const filtered = transactions
    .filter((t) => t.date.startsWith(filterMonth))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleSave = () => {
    if (!form.description.trim() || !form.amount) { toast.error("Preencha todos os campos"); return; }
    setTransactions((prev) => [...prev, {
      id: crypto.randomUUID(),
      date: form.date,
      description: form.description,
      type: form.type,
      amount: parseFloat(form.amount),
      category: form.category,
    }]);
    setForm({ description: "", type: "income", amount: "", category: "Consulta", date: format(new Date(), "yyyy-MM-dd") });
    setOpen(false);
    toast.success("Lançamento adicionado");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Livro Caixa</h1>
        <div className="flex gap-2">
          <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-auto" />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Lançamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Lançamento</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={form.type} onValueChange={(v: "income" | "expense") => setForm({ ...form, type: v, category: categories[v][0] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Receita</SelectItem>
                        <SelectItem value="expense">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Categoria</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories[form.type].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Descrição *</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Valor (R$) *</Label>
                    <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Receitas</p>
              <p className="text-xl font-bold text-success">R$ {totalIncome.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="text-xl font-bold text-destructive">R$ {totalExpense.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className={`text-xl font-bold ${balance >= 0 ? "text-success" : "text-destructive"}`}>
              R$ {balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum lançamento neste mês.</p>
          ) : (
            <div className="divide-y">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${t.type === "income" ? "bg-success" : "bg-destructive"}`} />
                    <div>
                      <p className="font-medium text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(t.date), "dd/MM/yyyy")} • {t.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "-"} R$ {t.amount.toFixed(2)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setTransactions((prev) => prev.filter((x) => x.id !== t.id));
                      toast.success("Lançamento removido");
                    }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Financial;
