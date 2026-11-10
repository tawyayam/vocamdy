import { BottomNav } from "@/components/bottom-nav";
import { SidebarNav } from "@/components/sidebar-nav";
import { requireUser } from "@/features/auth/server";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const { email } = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col lg:pl-64">
      <SidebarNav email={email} />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-4 pb-28 pt-8 md:max-w-[880px] lg:max-w-[1120px] lg:px-8 lg:pb-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
