import { motion } from "framer-motion";
import { Search, Loader2, Trash2, Ban, CheckCircle, Eye } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Navigate, Link } from "react-router-dom";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAdmin,
  });

  const suspendUser = useMutation({
    mutationFn: async ({ id, suspend }: { id: string; suspend: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: suspend })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success("User updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async (profileId: string) => {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_profiles"] });
      toast.success("User profile deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (adminLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/" replace />;

  const filtered = profiles.filter((p: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-foreground tracking-tight">
          User Management
        </h1>
        <p className="text-muted-foreground mt-1">
          View and manage all registered users.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Phone</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any, i: number) => {
                  const isCurrentUser = p.user_id === user?.id;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary-foreground">
                              {(p.full_name || p.email || "U")[0]?.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-foreground">{p.full_name || "—"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">{p.email || "—"}</td>
                      <td className="p-4 text-sm text-muted-foreground">{p.phone || "—"}</td>
                      <td className="p-4">
                        {p.is_suspended ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                            Suspended
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/users/${p.user_id}`}
                            className="p-2 rounded-lg hover:bg-secondary transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-accent" />
                          </Link>
                          {!isCurrentUser && (
                            <>
                              <button
                                onClick={() => suspendUser.mutate({ id: p.id, suspend: !p.is_suspended })}
                                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                title={p.is_suspended ? "Unsuspend" : "Suspend"}
                              >
                                {p.is_suspended ? (
                                  <CheckCircle className="w-4 h-4 text-success" />
                                ) : (
                                  <Ban className="w-4 h-4 text-warning" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Delete this user's profile? This cannot be undone.")) {
                                    deleteUser.mutate(p.id);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-border">
            {filtered.map((p: any, i: number) => {
              const isCurrentUser = p.user_id === user?.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary-foreground">
                          {(p.full_name || p.email || "U")[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                    </div>
                    {p.is_suspended ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">Suspended</span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-success/10 text-success">Active</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.phone || "No phone"}</span>
                    {!isCurrentUser && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => suspendUser.mutate({ id: p.id, suspend: !p.is_suspended })}
                          className="p-1.5 rounded hover:bg-secondary"
                        >
                          {p.is_suspended ? <CheckCircle className="w-4 h-4 text-success" /> : <Ban className="w-4 h-4 text-warning" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this user's profile?")) deleteUser.mutate(p.id);
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
