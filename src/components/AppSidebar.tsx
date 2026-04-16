import {
  LayoutDashboard, Users, CalendarDays, FileText, FileBadge,
  Smile, DollarSign, Package, Settings, Bot, StickyNote, LogOut,
  Shield, Upload, ClipboardCheck, Trash2, Crown, Calculator,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("is_platform_admin", { _user_id: user.id }).then(({ data }) => {
      setIsPlatformAdmin(data === true);
    });
  }, [user]);

  const items = [
    { title: t("menu.dashboard"), url: "/", icon: LayoutDashboard },
    { title: t("menu.patients"), url: "/pacientes", icon: Users },
    { title: t("menu.schedule"), url: "/agenda", icon: CalendarDays },
    { title: t("menu.prescriptions"), url: "/receituario", icon: FileText },
    { title: t("menu.certificates"), url: "/atestados", icon: FileBadge },
    { title: t("menu.consent"), url: "/consentimento", icon: ClipboardCheck },
    { title: t("menu.budget"), url: "/orcamento", icon: Calculator },
    { title: t("menu.odontogram"), url: "/odontograma", icon: Smile },
    { title: t("menu.aiAssistant"), url: "/assistente-ia", icon: Bot },
    { title: t("menu.notes"), url: "/notas", icon: StickyNote },
    { title: t("menu.financial"), url: "/financeiro", icon: DollarSign },
    { title: t("menu.materials"), url: "/materiais", icon: Package },
    { title: t("menu.audit"), url: "/auditoria", icon: Shield },
    { title: t("menu.trash"), url: "/lixeira", icon: Trash2 },
    { title: t("menu.importData"), url: "/importar-dados", icon: Upload },
    { title: t("menu.settings"), url: "/configuracoes", icon: Settings },
  ];

  const visibleItems = isPlatformAdmin
    ? [...items, { title: t("menu.adminPanel"), url: "/admin", icon: Crown }]
    : items;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-xs shrink-0">
            Btx
          </div>
          <span className="font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            Btx CliniCos
          </span>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>{t("menu.label")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={t("menu.logout")}
                  onClick={signOut}
                  className="flex items-center gap-3 text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>{t("menu.logout")}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
