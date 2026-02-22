import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type TableName = "patients" | "appointments" | "transactions" | "materials" | 
  "clinical_records" | "evolutions" | "patient_files" | "prescriptions" | 
  "certificates" | "odontograms" | "notes" | "clinic_settings";

export function useClinicData(
  table: TableName,
  options?: {
    filter?: Record<string, string>;
    orderBy?: string;
    orderAsc?: boolean;
  }
) {
  const { clinicId } = useAuth();
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!clinicId) { setLoading(false); return; }
    setLoading(true);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from(table).select("*").eq("clinic_id", clinicId);
    
    if (options?.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.orderAsc ?? true });
    }
    
    const { data: result, error } = await query;
    if (error) {
      console.error(`Error fetching ${table}:`, error);
    } else {
      setData(result || []);
    }
    setLoading(false);
  }, [clinicId, table, JSON.stringify(options?.filter), options?.orderBy, options?.orderAsc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const insert = async (record: Record<string, unknown>) => {
    if (!clinicId) return null;
    const { data: result, error } = await supabase
      .from(table)
      .insert({ ...record, clinic_id: clinicId } as never)
      .select()
      .single();
    if (error) {
      console.error(`Error inserting into ${table}:`, error);
      toast.error("Erro ao salvar dados");
      return null;
    }
    await fetchData();
    return result;
  };

  const update = async (id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase
      .from(table)
      .update(updates as never)
      .eq("id", id);
    if (error) {
      console.error(`Error updating ${table}:`, error);
      toast.error("Erro ao atualizar");
      return false;
    }
    await fetchData();
    return true;
  };

  const remove = async (id: string) => {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id);
    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      toast.error("Erro ao remover");
      return false;
    }
    await fetchData();
    return true;
  };

  return { data, loading, refetch: fetchData, insert, update, remove };
}
