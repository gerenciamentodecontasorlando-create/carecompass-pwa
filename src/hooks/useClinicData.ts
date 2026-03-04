import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { getCachedData, setCachedData, addToSyncQueue } from "@/lib/offlineDb";
import { useOnlineStatus } from "./useOnlineStatus";

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
  const isOnline = useOnlineStatus();
  const isOnlineRef = useRef(isOnline);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep ref in sync without triggering re-renders of fetchData
  useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  const cacheKey = `${table}:${clinicId}:${JSON.stringify(options?.filter)}`;

  const fetchData = useCallback(async () => {
    if (!clinicId) { setLoading(false); return; }
    setLoading(true);

    // Try loading from cache first (instant display)
    const cached = await getCachedData(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
    }

    if (!isOnlineRef.current) {
      if (!cached) setLoading(false);
      return;
    }

    // Fetch from server
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
      await setCachedData(cacheKey, result || []);
    }
    setLoading(false);
  }, [clinicId, table, cacheKey, options?.orderBy, options?.orderAsc]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when coming back online (without recreating fetchData)
  useEffect(() => {
    if (isOnline && clinicId) {
      fetchData();
    }
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  const insert = async (record: Record<string, unknown>) => {
    if (!clinicId) return null;
    const payload = { ...record, clinic_id: clinicId };

    if (!isOnlineRef.current) {
      // Generate temp ID and save locally
      const tempId = crypto.randomUUID();
      const tempRecord = { ...payload, id: tempId, created_at: new Date().toISOString() };
      const newData = [...data, tempRecord];
      setData(newData);
      await setCachedData(cacheKey, newData);
      await addToSyncQueue({ table, operation: "insert", payload });
      toast.info("Salvo offline — será sincronizado quando a conexão voltar");
      return tempRecord;
    }

    const { data: result, error } = await supabase
      .from(table)
      .insert(payload as never)
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
    if (!isOnlineRef.current) {
      const newData = data.map((item) =>
        String(item.id) === id ? { ...item, ...updates } : item
      );
      setData(newData);
      await setCachedData(cacheKey, newData);
      await addToSyncQueue({ table, operation: "update", payload: updates, recordId: id });
      toast.info("Atualizado offline — será sincronizado quando a conexão voltar");
      return true;
    }

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
    if (!isOnlineRef.current) {
      const newData = data.filter((item) => String(item.id) !== id);
      setData(newData);
      await setCachedData(cacheKey, newData);
      await addToSyncQueue({ table, operation: "delete", recordId: id, payload: {} });
      toast.info("Removido offline — será sincronizado quando a conexão voltar");
      return true;
    }

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
