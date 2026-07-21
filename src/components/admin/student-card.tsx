"use client";

import { useState, useTransition } from "react";
import { 
  ShieldCheck, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Sparkles, 
  Check, 
  Plus, 
  Loader2, 
  UserPlus, 
  UserMinus, 
  Mail, 
  Calendar,
  Zap,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BONUSES, BASE_ENTITLEMENT } from "@/lib/bonuses";
import { STYLES, STYLE_GOALS, MAIN_DIFFICULTIES } from "@/lib/constants";
import { 
  deleteStudentAction, 
  grantStudentEntitlementAction, 
  revokeStudentEntitlementAction, 
  toggleAdminStatusAction,
  addStudentTokensAction,
  grantBaseEntitlementWithExpiryAction
} from "@/app/actions/admin";
import { StudentChatModal } from "@/components/admin/student-chat-modal";

interface StudentCardProps {
  student: {
    user_id: string;
    name: string | null;
    email: string | null;
    is_admin: boolean;
    onboarding_completed: boolean;
    created_at: string;
    style_goal?: string | null;
    preferred_style?: string | null;
    main_difficulty?: string | null;
  };
  entitlements: { entitlement: string; expires_at: string | null }[];
  lastSeen: string | undefined;
  completedLessonsCount: number;
  totalLessonsCount: number;
  aiMessagesCount: number;
  aiTokensCount: number;
  fitCheckCredits: {
    balance: number;
    expires_at: string | null;
  };
}

export function StudentCard({
  student,
  entitlements,
  lastSeen,
  completedLessonsCount,
  totalLessonsCount,
  aiMessagesCount,
  aiTokensCount,
  fitCheckCredits
}: StudentCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const hasEntitlement = (key: string) => entitlements.some((e) => e.entitlement === key);
  const getEntitlement = (key: string) => entitlements.find((e) => e.entitlement === key);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initials = (student.name ?? "S N")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formattedDate = new Date(student.created_at).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo"
  });

  const formattedSeen = lastSeen
    ? new Date(lastSeen).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit"
      })
    : null;

  const pctProgress = totalLessonsCount
    ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
    : 0;

  const handleAction = (actionFn: () => Promise<void>) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await actionFn();
      } catch (err: any) {
        setErrorMsg(err.message ?? "Ocorreu um erro ao realizar a operação.");
      }
    });
  };

  const handleToggleEntitlement = (key: string, hasIt: boolean) => {
    if (hasIt) {
      handleAction(() => revokeStudentEntitlementAction(student.user_id, key));
    } else {
      handleAction(() => grantStudentEntitlementAction(student.user_id, key));
    }
  };

  const handleGrantBaseWithExpiry = (days: number | null) => {
    handleAction(() => grantBaseEntitlementWithExpiryAction(student.user_id, days));
  };

  const handleToggleAdmin = () => {
    const nextAdminState = !student.is_admin;
    handleAction(() => toggleAdminStatusAction(student.user_id, nextAdminState));
  };

  const handleDelete = () => {
    handleAction(async () => {
      await deleteStudentAction(student.user_id);
      setShowDeleteConfirm(false);
    });
  };

  const handleAddTokens = (amount: number) => {
    handleAction(() => addStudentTokensAction(student.user_id, amount));
  };

  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-5 shadow-sm transition-all hover:border-border/80">
      {errorMsg && (
        <div className="mb-4 rounded-xl bg-danger/10 p-3 text-xs text-danger flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="font-bold underline ml-2">Fechar</button>
        </div>
      )}

      {/* Grid Superior */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Lado Esquerdo: Perfil Básico */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 font-medium text-foreground">
              {student.name || "Sem nome"}
              {student.is_admin && (
                <Badge variant="accent" className="gap-1 text-[10px] py-0 px-2 font-semibold">
                  <ShieldCheck className="size-3" />
                  Admin
                </Badge>
              )}
              {student.onboarding_completed ? (
                <Badge variant="success" className="text-[10px] py-0 px-2 font-semibold">
                  Onboarding OK
                </Badge>
              ) : (
                <Badge variant="default" className="text-[10px] py-0 px-2 font-semibold bg-surface-2 text-muted">
                  Pendente
                </Badge>
              )}
            </h3>
            <p className="mt-1 text-xs text-muted flex items-center gap-1">
              <Mail className="size-3" />
              {student.email ?? "Sem e-mail"}
            </p>
          </div>
        </div>

        {/* Lado Direito: Datas / Acesso */}
        <div className="shrink-0 text-right text-xs text-muted">
          <p className="flex items-center justify-end gap-1.5">
            <Calendar className="size-3" />
            Criado em: <span className="font-medium text-foreground">{formattedDate}</span>
          </p>
          <p className="mt-1 text-muted-2">
            {formattedSeen ? `Último acesso: ${formattedSeen}` : "Nunca acessou a plataforma"}
          </p>
        </div>
      </div>

      {/* Progresso de Aulas */}
      <div className="mt-4 rounded-xl bg-surface-2/60 p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted flex items-center gap-1">
            <BookOpen className="size-3.5" /> Progresso de aulas concluídas
          </span>
          <span className="font-semibold text-foreground">
            {completedLessonsCount} / {totalLessonsCount} ({pctProgress}%)
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div 
            className="h-full rounded-full bg-accent transition-all duration-500" 
            style={{ width: `${Math.min(pctProgress, 100)}%` }}
          />
        </div>
      </div>

      {/* Uso de IA (Mensagens e Tokens) */}
      <div className="mt-2.5 rounded-xl bg-surface-2/40 border border-border/40 p-3.5 flex flex-col gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/20 pb-2">
          <span className="text-muted flex items-center gap-1.5 font-semibold">
            <Sparkles className="size-3.5 text-accent" /> Chat IA & Saldo de Tokens (Fit Check)
          </span>
          
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-[11px] font-semibold gap-1"
            onClick={() => setIsChatModalOpen(true)}
          >
            <MessageSquare className="size-3 text-accent" /> Ver Chat
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-muted-2">
            <span>Mensagens: <strong className="text-foreground">{aiMessagesCount}</strong></span>
            <span>Uso Total: <strong className="text-foreground">{aiTokensCount.toLocaleString("pt-BR")} tks</strong></span>
            <span>
              Saldo Atual: <strong className="text-foreground">{fitCheckCredits.balance} tokens</strong>
              {fitCheckCredits.expires_at && (() => {
                const exp = new Date(fitCheckCredits.expires_at);
                if (exp > new Date()) {
                  return (
                    <span className="text-[10px] text-success ml-1.5 bg-success/5 border border-success/15 px-1.5 py-0.5 rounded-md">
                      Vence em {exp.toLocaleDateString("pt-BR")}
                    </span>
                  );
                } else if (fitCheckCredits.balance > 0) {
                  return (
                    <span className="text-[10px] text-danger ml-1.5 bg-danger/5 border border-danger/15 px-1.5 py-0.5 rounded-md">
                      Expirou em {exp.toLocaleDateString("pt-BR")}
                    </span>
                  );
                }
                return null;
              })()}
            </span>
          </div>

          {/* Ações de Crédito (Liberação de Tokens) */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted mr-1">Adicionar:</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              className="h-7 text-[10px] font-semibold gap-1 hover:bg-accent/5 hover:text-accent border-accent/20"
              onClick={() => handleAddTokens(50)}
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : "+50 tks"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              className="h-7 text-[10px] font-semibold gap-1 hover:bg-accent/5 hover:text-accent border-accent/20"
              onClick={() => handleAddTokens(200)}
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : "+200 tks"}
            </Button>
          </div>
        </div>
      </div>

      {/* Detalhes de Estilo & Onboarding (Expansível) */}
      {student.onboarding_completed && (
        <div className="mt-3 border-t border-border/40 pt-3">
          <button 
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex w-full items-center justify-between text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1">
              <Sparkles className="size-3.5 text-accent" /> Detalhes do estilo e perfil (onboarding)
            </span>
            {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
          
          {showDetails && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs animate-fade-in">
              <div className="rounded-xl border border-border/30 bg-surface-2/30 p-2.5">
                <p className="text-muted-2 font-medium uppercase text-[10px]">Objetivo</p>
                <p className="mt-1 font-medium text-foreground">{student.style_goal ? (STYLE_GOALS[student.style_goal] ?? student.style_goal) : "—"}</p>
              </div>
              <div className="rounded-xl border border-border/30 bg-surface-2/30 p-2.5">
                <p className="text-muted-2 font-medium uppercase text-[10px]">Estilo Preferido</p>
                <p className="mt-1 font-medium text-foreground">{student.preferred_style ? (STYLES[student.preferred_style] ?? student.preferred_style) : "—"}</p>
              </div>
              <div className="rounded-xl border border-border/30 bg-surface-2/30 p-2.5">
                <p className="text-muted-2 font-medium uppercase text-[10px]">Principal Dificuldade</p>
                <p className="mt-1 font-medium text-foreground">{student.main_difficulty ? (MAIN_DIFFICULTIES[student.main_difficulty] ?? student.main_difficulty) : "—"}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gerenciamento de Acesso / Aumentar Plano */}
      <div className="mt-4 border-t border-border/60 pt-4">
        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1 mb-2.5">
          <Zap className="size-3.5 text-accent fill-accent/20" /> Gerenciar Acessos & Planos (Liberações)
        </h4>
        
        <div className="flex flex-col gap-2">
          {/* Acesso Base */}
          {(() => {
            const baseEnt = getEntitlement(BASE_ENTITLEMENT);
            const hasBase = !!baseEnt;
            const isBaseExpired = baseEnt?.expires_at ? new Date(baseEnt.expires_at) <= new Date() : false;
            
            return (
              <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-surface-2/40 px-3.5 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      Acesso Principal (MPO)
                      {hasBase ? (
                        isBaseExpired ? (
                          <span className="text-[10px] font-normal text-danger bg-danger/10 px-1.5 py-0.5 rounded-full border border-danger/10">Expirado</span>
                        ) : (
                          <span className="text-[10px] font-normal text-success bg-success/10 px-1.5 py-0.5 rounded-full border border-success/10">Ativo</span>
                        )
                      ) : (
                        <span className="text-[10px] font-normal text-muted bg-surface-2 px-1.5 py-0.5 rounded-full border border-border/10">Sem acesso</span>
                      )}
                    </p>
                    <p className="text-[10px] text-muted mt-1">
                      {baseEnt ? (
                        baseEnt.expires_at ? (
                          <>
                            {isBaseExpired ? "Acesso expirou em: " : "Vence em: "}
                            <strong className="text-foreground">{new Date(baseEnt.expires_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}</strong>
                          </>
                        ) : (
                          <span className="text-success font-medium">Acesso Vitalício / Permanente</span>
                        )
                      ) : (
                        "O aluno não possui permissão para navegar na plataforma"
                      )}
                    </p>
                  </div>

                  {hasBase && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      className="h-8 text-xs font-medium text-danger hover:bg-danger/5 border-danger/20 hover:text-danger"
                      onClick={() => handleToggleEntitlement(BASE_ENTITLEMENT, true)}
                    >
                      {isPending ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        "Revogar Acesso"
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border/10 pt-2.5">
                  <span className="text-[10px] text-muted mr-1">Liberar / Estender acesso:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="h-7 text-[10px] font-semibold gap-1 hover:bg-accent/5 hover:text-accent border-accent/20"
                    onClick={() => handleGrantBaseWithExpiry(30)}
                  >
                    {isPending ? <Loader2 className="size-3 animate-spin" /> : "+30 dias (Mensal)"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="h-7 text-[10px] font-semibold gap-1 hover:bg-accent/5 hover:text-accent border-accent/20"
                    onClick={() => handleGrantBaseWithExpiry(365)}
                  >
                    {isPending ? <Loader2 className="size-3 animate-spin" /> : "+1 ano (Anual)"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    className="h-7 text-[10px] font-semibold gap-1 hover:bg-accent/5 hover:text-accent border-accent/20"
                    onClick={() => handleGrantBaseWithExpiry(null)}
                  >
                    {isPending ? <Loader2 className="size-3 animate-spin" /> : "Vitalício (Permanente)"}
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Bônus */}
          <div className="grid gap-2 sm:grid-cols-2 mt-1">
            {BONUSES.map((bonus) => {
              const hasBonus = hasEntitlement(bonus.key);
              const bonusObj = getEntitlement(bonus.key);
              const BonusIcon = bonus.icon;
              return (
                <div 
                  key={bonus.key} 
                  className="flex items-center justify-between rounded-xl border border-border/30 bg-surface-2/20 p-2.5"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-medium text-foreground truncate flex items-center gap-1">
                      {BonusIcon && <BonusIcon className="size-3.5 text-accent shrink-0" />}
                      {bonus.title}
                    </p>
                    <p className="text-[9px] text-muted truncate mt-0.5">
                      {bonusObj?.expires_at ? (
                        `Expira em: ${new Date(bonusObj.expires_at).toLocaleDateString("pt-BR")}`
                      ) : (
                        bonus.short
                      )}
                    </p>
                  </div>
                  
                  <Button
                    size="sm"
                    variant={hasBonus ? "outline" : "secondary"}
                    disabled={isPending}
                    className="h-7 text-[11px] font-medium shrink-0"
                    onClick={() => handleToggleEntitlement(bonus.key, hasBonus)}
                  >
                    {isPending ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : hasBonus ? (
                      <>
                        <Check className="size-3 mr-0.5 text-success" /> Ativo
                      </>
                    ) : (
                      <>
                        <Plus className="size-3 mr-0.5" /> Liberar
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ações Críticas */}
      <div className="mt-4 border-t border-border/40 pt-4 flex flex-wrap items-center justify-between gap-3">
        {/* Modificar Admin */}
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending || showDeleteConfirm}
          className="text-xs hover:bg-surface-2/80 gap-1.5"
          onClick={handleToggleAdmin}
        >
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : student.is_admin ? (
            <>
              <UserMinus className="size-3.5 text-muted" /> Remover Admin
            </>
          ) : (
            <>
              <UserPlus className="size-3.5 text-accent" /> Tornar Admin
            </>
          )}
        </Button>

        {/* Excluir Aluno */}
        {!showDeleteConfirm ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-danger hover:bg-danger/10 gap-1.5"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending}
          >
            <Trash2 className="size-3.5" />
            Excluir Conta
          </Button>
        ) : (
          <div className="flex items-center gap-2 bg-danger/5 rounded-xl border border-danger/20 p-1.5 animate-fade-in">
            <span className="text-[11px] font-semibold text-danger px-2">Tem certeza?</span>
            <Button
              size="sm"
              variant="danger"
              className="h-7 text-xs font-semibold px-3"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? <Loader2 className="size-3 animate-spin" /> : "Confirmar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2.5"
              disabled={isPending}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>

      {/* Modal de Histórico de Chats de IA do Aluno */}
      <StudentChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        studentId={student.user_id}
        studentName={student.name ?? student.email ?? "Aluno"}
      />
    </div>
  );
}
