import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface ProfileData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  portfolio: string;
  summary: string;
}

export interface ExperienceData {
  id?: string;
  title: string;
  company: string;
  period: string;
  description: string;
  sort_order?: number;
}

export interface SkillData {
  id?: string;
  name: string;
  category?: string;
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const experiencesQuery = useQuery({
    queryKey: ["experiences", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const skillsQuery = useQuery({
    queryKey: ["skills", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (profile: Partial<ProfileData>) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("profiles")
        .update(profile)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile saved!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addExperience = useMutation({
    mutationFn: async (exp: Omit<ExperienceData, "id">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("experiences")
        .insert({ ...exp, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences", user?.id] });
      toast.success("Experience added!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateExperience = useMutation({
    mutationFn: async ({ id, ...exp }: ExperienceData) => {
      if (!user || !id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("experiences")
        .update(exp)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences", user?.id] });
      toast.success("Experience updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteExperience = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("experiences")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiences", user?.id] });
      toast.success("Experience deleted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSkill = useMutation({
    mutationFn: async (skill: Omit<SkillData, "id">) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("skills")
        .insert({ ...skill, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", user?.id] });
      toast.success("Skill added!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSkill = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("skills")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    profile: profileQuery.data,
    experiences: experiencesQuery.data || [],
    skills: skillsQuery.data || [],
    isLoading: profileQuery.isLoading || experiencesQuery.isLoading || skillsQuery.isLoading,
    updateProfile,
    addExperience,
    updateExperience,
    deleteExperience,
    addSkill,
    deleteSkill,
  };
}
