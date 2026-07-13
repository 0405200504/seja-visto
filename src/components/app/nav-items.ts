import {
  LayoutDashboard,
  BookOpen,
  BookMarked,
  Layers,
  Shirt,
  Heart,
  CalendarCheck,
  User,
  Palette,
  Tag,
  Gift,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/metodo", label: "Método", icon: BookOpen },
  { href: "/combinacoes", label: "Combinações", icon: Layers },
  { href: "/fit-check", label: "Fit Check", icon: Sparkles },
  { href: "/guias", label: "Guias", icon: BookMarked },
  { href: "/bonus", label: "Bônus", icon: Gift },
  { href: "/estilos", label: "Estilos", icon: Palette },
  { href: "/mais-procurados", label: "Mais Procurados", icon: Tag },
  { href: "/guarda-roupa", label: "Guarda-Roupa", icon: Shirt },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/plano-de-acao", label: "Plano de Ação", icon: CalendarCheck },
  { href: "/perfil", label: "Perfil", icon: User },
];
