import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Shirt,
  Heart,
  CalendarCheck,
  User,
  Palette,
  Tag,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  mobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobile: true },
  { href: "/metodo", label: "Método", icon: BookOpen, mobile: true },
  { href: "/combinacoes", label: "Combinações", icon: Layers, mobile: true },
  { href: "/estilos", label: "Estilos", icon: Palette, mobile: true },
  { href: "/mais-procurados", label: "Mais Procurados", icon: Tag },
  { href: "/guarda-roupa", label: "Guarda-Roupa", icon: Shirt },
  { href: "/favoritos", label: "Favoritos", icon: Heart },
  { href: "/plano-de-acao", label: "Plano de Ação", icon: CalendarCheck },
  { href: "/perfil", label: "Perfil", icon: User, mobile: true },
];
