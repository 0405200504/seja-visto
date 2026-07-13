import { requireProfile } from "@/lib/auth";
import { Sidebar, MobileHeader } from "@/components/app/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile();

  return (
    <div className="min-h-dvh">
      <Sidebar isAdmin={profile.is_admin} name={profile.name} />
      <MobileHeader isAdmin={profile.is_admin} name={profile.name} />
      <main className="pb-10 pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
