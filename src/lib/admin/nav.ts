import {
  Webhook,
  LayoutDashboard,
  Users,
  Tags,
  Camera,
  MessageSquare,
  Receipt,
  Package,
  KeyRound,
  Undo2,
  BookOpen,
  Layers,
  Shirt,
  BookMarked,
  Palette,
  Tag,
  CalendarCheck,
  Gift,
  Link2,
  Filter,
  Sparkles,
  Plug,
  Settings,
  ScrollText,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** chave do badge de pendências calculado no layout */
  badge?: string;
};

export type AdminNavSection = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavSection[] = [
  {
    label: "Visão geral",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard, badge: "atencao" }],
  },
  {
    label: "Pessoas",
    items: [
      { href: "/admin/alunos", label: "Alunos", icon: Users },
      { href: "/admin/segmentos", label: "Segmentos & Tags", icon: Tags },
      { href: "/admin/comunidade", label: "Comunidade (fits)", icon: Camera, badge: "fits_pendentes" },
      { href: "/admin/conversas", label: "Conversas de IA", icon: MessageSquare },
    ],
  },
  {
    label: "Receita",
    items: [
      { href: "/admin/receita/transacoes", label: "Transações", icon: Receipt },
      { href: "/admin/receita/produtos", label: "Produtos & Ofertas", icon: Package },
      { href: "/admin/receita/acessos", label: "Acessos & Planos", icon: KeyRound, badge: "acessos_vencendo" },
      { href: "/admin/receita/reembolsos", label: "Reembolsos", icon: Undo2 },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { href: "/admin/conteudo/metodo", label: "Método", icon: BookOpen },
      { href: "/admin/conteudo/looks", label: "Looks", icon: Layers, badge: "looks_sem_imagem" },
      { href: "/admin/conteudo/pecas", label: "Peças", icon: Shirt },
      { href: "/admin/conteudo/guias", label: "Guias", icon: BookMarked },
      { href: "/admin/conteudo/estilos", label: "Estilos", icon: Palette },
      { href: "/admin/conteudo/glossario", label: "Mais Procurados", icon: Tag },
      { href: "/admin/conteudo/plano", label: "Plano de Ação", icon: CalendarCheck },
      { href: "/admin/conteudo/bonus", label: "Bônus", icon: Gift },
    ],
  },
  {
    label: "Crescimento",
    items: [
      { href: "/admin/crescimento/links", label: "Links & UTMs", icon: Link2 },
      { href: "/admin/crescimento/funil", label: "Funil & Conversão", icon: Filter },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/sistema/ia", label: "Fit Check (IA)", icon: Sparkles },
      { href: "/admin/sistema/integracoes", label: "Integrações", icon: Plug },
      { href: "/admin/sistema/webhooks", label: "Webhooks", icon: Webhook },
      { href: "/admin/sistema/config", label: "Configurações", icon: Settings },
      { href: "/admin/sistema/auditoria", label: "Log de auditoria", icon: ScrollText },
      { href: "/admin/sistema/lixeira", label: "Lixeira", icon: Trash2 },
    ],
  },
];

/** Título por rota — usado em breadcrumbs e na busca global. */
export const ADMIN_PAGES: { href: string; title: string; section: string }[] = ADMIN_NAV.flatMap(
  (section) => section.items.map((i) => ({ href: i.href, title: i.label, section: section.label }))
);

export function pageTitle(href: string): string {
  return ADMIN_PAGES.find((p) => p.href === href)?.title ?? "Admin";
}
