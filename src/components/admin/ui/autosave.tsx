"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Formulários com AUTOSAVE por campo (debounce 800ms), indicador
 * "Salvando… / Salvo às 14:32" e aviso ao sair com alterações pendentes.
 */

type FieldAction = (field: string, value: string) => Promise<{ ok: boolean; message?: string }>;

type Status = { state: "idle" | "dirty" | "saving" | "saved" | "error"; at?: Date; message?: string };

const AutosaveContext = createContext<{
  action: FieldAction;
  report: (s: Status) => void;
} | null>(null);

export function AutosaveForm({
  action,
  children,
  className,
}: {
  action: FieldAction;
  children: React.ReactNode;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const pendingCount = useRef(0);

  const report = useCallback((s: Status) => {
    if (s.state === "saving") pendingCount.current += 1;
    if (s.state === "saved" || s.state === "error") pendingCount.current = Math.max(0, pendingCount.current - 1);
    setStatus(s);
  }, []);

  // aviso ao sair com alterações não salvas
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (status.state === "dirty" || status.state === "saving") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [status.state]);

  return (
    <AutosaveContext.Provider value={{ action, report }}>
      <div className={className}>
        <div className="sticky top-14 z-20 -mx-1 mb-3 flex justify-end px-1">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur",
              status.state === "error"
                ? "border-danger/30 bg-danger/10 text-danger"
                : status.state === "saving" || status.state === "dirty"
                  ? "border-border bg-surface-2/90 text-muted"
                  : "border-border bg-surface-2/90 text-muted-2"
            )}
            role="status"
          >
            {status.state === "saving" && (<><Loader2 className="size-3 animate-spin" /> Salvando…</>)}
            {status.state === "dirty" && (<><CloudUpload className="size-3" /> Alterações pendentes…</>)}
            {status.state === "saved" && (
              <>
                <CheckCircle2 className="size-3 text-success" />
                Salvo às {status.at?.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
              </>
            )}
            {status.state === "error" && <>Erro: {status.message ?? "não foi possível salvar"}</>}
            {status.state === "idle" && "Autosave ativado"}
          </span>
        </div>
        {children}
      </div>
    </AutosaveContext.Provider>
  );
}

function useAutosaveField(name: string, initial: string, validate?: (v: string) => string | null) {
  const ctx = useContext(AutosaveContext);
  if (!ctx) throw new Error("Campo de autosave fora de <AutosaveForm>.");
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  const onChange = (next: string) => {
    setValue(next);
    const validation = validate?.(next) ?? null;
    setError(validation);
    if (timer.current) clearTimeout(timer.current);
    if (validation) return; // validação inline: não salva valor inválido
    ctx.report({ state: "dirty" });
    timer.current = setTimeout(async () => {
      ctx.report({ state: "saving" });
      try {
        const res = await ctx.action(name, next);
        if (!res.ok) throw new Error(res.message);
        ctx.report({ state: "saved", at: new Date() });
        router.refresh();
      } catch (err) {
        ctx.report({ state: "error", message: err instanceof Error ? err.message : undefined });
      }
    }, 800);
  };

  return { value, onChange, error };
}

const fieldLabel = "mb-1.5 block text-xs font-semibold text-muted";
const fieldError = "mt-1 text-[11px] text-danger";

export function AutosaveInput({
  name, label, initial, placeholder, type = "text", validate, hint,
}: {
  name: string;
  label: string;
  initial: string;
  placeholder?: string;
  type?: string;
  hint?: string;
  validate?: (v: string) => string | null;
}) {
  const { value, onChange, error } = useAutosaveField(name, initial, validate);
  return (
    <div>
      <label className={fieldLabel} htmlFor={`as-${name}`}>{label}</label>
      <input
        id={`as-${name}`}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 w-full rounded-lg border bg-surface-2 px-3 text-sm text-foreground placeholder:text-muted-2 focus:outline-none",
          error ? "border-danger" : "border-border focus:border-accent"
        )}
      />
      {error ? <p className={fieldError}>{error}</p> : hint ? <p className="mt-1 text-[11px] text-muted-2">{hint}</p> : null}
    </div>
  );
}

export function AutosaveTextarea({
  name, label, initial, placeholder, rows = 4, validate,
}: {
  name: string;
  label: string;
  initial: string;
  placeholder?: string;
  rows?: number;
  validate?: (v: string) => string | null;
}) {
  const { value, onChange, error } = useAutosaveField(name, initial, validate);
  return (
    <div>
      <label className={fieldLabel} htmlFor={`as-${name}`}>{label}</label>
      <textarea
        id={`as-${name}`}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-2 focus:outline-none",
          error ? "border-danger" : "border-border focus:border-accent"
        )}
      />
      {error && <p className={fieldError}>{error}</p>}
    </div>
  );
}

export function AutosaveSelect({
  name, label, initial, options,
}: {
  name: string;
  label: string;
  initial: string;
  options: { value: string; label: string }[];
}) {
  const { value, onChange } = useAutosaveField(name, initial);
  return (
    <div>
      <label className={fieldLabel} htmlFor={`as-${name}`}>{label}</label>
      <select
        id={`as-${name}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer rounded-lg border border-border bg-surface-2 px-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
