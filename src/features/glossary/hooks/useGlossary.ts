import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, getAdminSupabase } from '@/shared/lib/supabase';

// Query Keys
export const glossaryKeys = {
  all: ['glossary'] as const,
  list: () => [...glossaryKeys.all, 'list'] as const,
};

// 용어사전 조회 (Record<term, definition> 형태)
export function useGlossary() {
  return useQuery({
    queryKey: glossaryKeys.list(),
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase.from('glossary').select('*');
      if (error) throw error;

      const glossaryMap: Record<string, string> = {};
      (data || []).forEach((row: { term: string; definition: string }) => {
        glossaryMap[row.term] = row.definition;
      });
      return glossaryMap;
    },
  });
}

// 용어사전 목록 조회 (배열 형태, Admin용)
export function useGlossaryList() {
  return useQuery({
    queryKey: [...glossaryKeys.all, 'array'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary')
        .select('*')
        .order('term');
      if (error) throw error;
      return data || [];
    },
  });
}

// Admin: 용어 추가
export function useAddGlossaryTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ term, definition }: { term: string; definition: string }) => {
      const { error } = await getAdminSupabase()
        .from('glossary')
        .insert({ term, definition });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glossaryKeys.all });
    },
  });
}

// Admin: 용어 수정
export function useUpdateGlossaryTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, term, definition }: { id: string; term: string; definition: string }) => {
      const { error } = await getAdminSupabase()
        .from('glossary')
        .update({ term, definition })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glossaryKeys.all });
    },
  });
}

// Admin: 용어 삭제
export function useDeleteGlossaryTerm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getAdminSupabase()
        .from('glossary')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: glossaryKeys.all });
    },
  });
}
