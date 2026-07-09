import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/logo-mpo-192.png"
        alt="MPO"
        width={32}
        height={32}
        className="size-8 rounded-lg shadow-[0_0_20px_-4px_rgb(47_107_255/0.7)]"
        priority
      />
      <div className="leading-none">
        <span className="font-display text-sm font-semibold tracking-tight">
          Manual Prático
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-muted">
          do Outfit
        </span>
      </div>
    </div>
  );
}
