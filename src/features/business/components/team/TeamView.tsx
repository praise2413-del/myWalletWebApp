import { Plus, Trash2, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { InviteMemberFormModal } from "@/features/business/components/InviteMemberFormModal";
import { useTeamMembers } from "@/features/business/hooks/useTeamMembers";
import { useAuth } from "@/hooks/useAuth";
import { useBusiness } from "@/hooks/useBusiness";
import { useToastStore } from "@/hooks/useToastStore";
import { supabase } from "@/lib/supabase/client";
import { TEAM_ROLE_OPTIONS, type InviteMemberFormInput } from "@/lib/validations/teamMember";
import type { TeamMember } from "@/types";

function roleLabel(role: TeamMember["role"]): string {
  if (role === "OWNER") return "Owner";
  return TEAM_ROLE_OPTIONS.find((o) => o.value === role)?.label ?? role;
}

export function TeamView() {
  const { user } = useAuth();
  const { activeBusiness } = useBusiness();
  const showToast = useToastStore((state) => state.showToast);
  const { members, loading, error, refresh } = useTeamMembers();
  const isOwner = Boolean(activeBusiness && user && activeBusiness.ownerId === user.id);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  const handleInvite = async (values: InviteMemberFormInput) => {
    if (!activeBusiness) return { error: "No active business." };
    const { error: rpcError } = await supabase.rpc("invite_business_member", {
      p_business_id: activeBusiness.id,
      p_email: values.email,
      p_role: values.role,
    });
    if (rpcError) return { error: rpcError.message || "We couldn't send this invite." };
    await refresh();
    showToast("Team member added.");
  };

  const handleRoleChange = async (member: TeamMember, role: TeamMember["role"]) => {
    const { error: updateError } = await supabase.from("business_members").update({ role }).eq("id", member.id);
    if (updateError) {
      showToast("We couldn't update this member's role.", "error");
      return;
    }
    await refresh();
    showToast("Role updated.");
  };

  const handleRemove = async () => {
    if (!removing) return;
    const { error: deleteError } = await supabase.from("business_members").delete().eq("id", removing.id);
    setRemoving(null);
    if (deleteError) {
      showToast("We couldn't remove this team member.", "error");
      return;
    }
    await refresh();
    showToast("Team member removed.");
  };

  return (
    <div>
      {isOwner && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setInviteOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Invite Member
          </Button>
        </div>
      )}

      {!isOwner && (
        <p className="mb-4 text-xs text-text-tertiary">Only the business owner can invite, remove, or change the role of team members.</p>
      )}

      {error ? (
        <p className="text-sm text-expense-600">{error}</p>
      ) : loading ? (
        <Skeleton className="h-40 w-full" />
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No team members" description="Invite someone with a myWallet account to collaborate on this business." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">{member.email}</p>
                <Badge tone={member.isOwner ? "primary" : "neutral"} className="mt-1">
                  {roleLabel(member.role)}
                </Badge>
              </div>
              {isOwner && !member.isOwner && (
                <div className="flex shrink-0 items-center gap-1">
                  <select
                    aria-label={`Change role for ${member.email}`}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value as TeamMember["role"])}
                    className="h-8 rounded-lg border border-border-strong bg-surface px-2 text-xs text-text-primary focus:border-primary-500 focus:outline-none"
                  >
                    {TEAM_ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setRemoving(member)}
                    aria-label={`Remove ${member.email}`}
                    className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-expense-50 hover:text-expense-600"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
              {member.isOwner && (
                <span className="flex shrink-0 items-center gap-1 text-xs text-text-tertiary">
                  <UserCog className="size-3.5" aria-hidden="true" />
                  Full access
                </span>
              )}
            </div>
          ))}
        </Card>
      )}

      <InviteMemberFormModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSubmit={handleInvite} />

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title="Remove team member?"
        description={`${removing?.email ?? "This person"} will lose access to this business.`}
      />
    </div>
  );
}
