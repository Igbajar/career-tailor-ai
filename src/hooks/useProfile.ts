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

export interface EducationData {
  id?: string;
  degree: string;
  institution: string;
  period: string;
  description: string;
  sort_order?: number;
}

export interface SkillData {
  id?: string;
  name: string;
  category?: string;
}

export interface CertificationData {
  id?: string;
  name: string;
  issuer: string;
  date_obtained?: string;
  description?: string;
  sort_order?: number;
}

export interface PublicationData {
  id?: string;
  title: string;
  publisher: string;
  date_published?: string;
  description?: string;
  url?: string;
  sort_order?: number;
}

export interface ProjectData {
  id?: string;
  name: string;
  role?: string;
  period?: string;
  description?: string;
  url?: string;
  sort_order?: number;
}

export interface ProfessionalBodyData {
  id?: string;
  name: string;
  role?: string;
  member_since?: string;
  description?: string;
  sort_order?: number;
}

function useCrudQuery(
  table: string,
  queryKey: string,
  orderCol: string = "sort_order"
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fullKey = [queryKey, user?.id];

  const query = useQuery({
    queryKey: fullKey,
    queryFn: async (): Promise<any[]> => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("user_id", user.id)
        .order(orderCol, { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const add = useMutation({
    mutationFn: async (item: any) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from(table).insert({ ...item, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fullKey });
      toast.success("Added!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...item }: any) => {
      if (!user || !id) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from(table).update(item).eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fullKey });
      toast.success("Updated!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await (supabase as any).from(table).delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fullKey });
      toast.success("Deleted!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { data: query.data || [], isLoading: query.isLoading, add, update, remove };
}

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (profile: Partial<ProfileData>) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(profile).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Profile saved!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const experiences = useCrudQuery("experiences", "experiences");
  const education = useCrudQuery("education", "education");
  const skills = useCrudQuery("skills", "skills", "created_at");
  const certifications = useCrudQuery("certifications", "certifications");
  const publications = useCrudQuery("publications", "publications");
  const projects = useCrudQuery("projects", "projects");
  const professionalBodies = useCrudQuery("professional_bodies", "professionalBodies");

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading || experiences.isLoading || education.isLoading || skills.isLoading,
    updateProfile,
    experiences,
    education,
    skills,
    certifications,
    publications,
    projects,
    professionalBodies,
  };
}
