'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Menu, X } from 'lucide-react';
import DashboardGlobalSearch from '@/app/dashboard/_components/DashboardGlobalSearch';
import {
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_PAGE_META,
  DASHBOARD_PRIMARY_LINK,
  dashboardNavGroupIdForPath,
  isDashboardNavLeafActive,
} from '@/app/dashboard/_config/navigation';
import { useAppDispatch } from '@/store/hook';
import { logout } from '@/features/admin-auth/adminAuthSlice';

type DashboardShellProps = {
  children: React.ReactNode;
};

const navLinkClass = (active: boolean, dense?: boolean) =>
  `group flex items-center gap-3 rounded-xl border text-left transition-all duration-200 ${
    dense ? 'px-2.5 py-2 text-[13px]' : 'px-3 py-2.5 text-sm'
  } ${
    active
      ? 'border-[rgba(255,255,255,0.1)] bg-linear-to-r from-[#050506] via-[#141418] to-[#2a2a31] font-semibold text-[#f8f8fa] shadow-[0_16px_32px_-18px_rgba(0,0,0,0.95)]'
      : 'border-transparent text-[#6b7280] hover:border-[rgba(0,0,0,0.08)] hover:bg-[rgba(17,17,17,0.06)] hover:text-[#1f2937]'
  }`;

function DashboardNavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const activeGroupId = dashboardNavGroupIdForPath(pathname);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set());

  const toggleGroup = (id: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { key, label, icon: PrimaryIcon, href: primaryHref } = DASHBOARD_PRIMARY_LINK;
  const primaryActive = isDashboardNavLeafActive(pathname, primaryHref);

  return (
    <nav
      className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      aria-label="Dashboard navigation"
    >
      <Link
        key={key}
        href={primaryHref}
        onClick={() => onNavigate?.()}
        className={navLinkClass(primaryActive)}
      >
        <PrimaryIcon size={16} className={primaryActive ? 'text-[#f5f5f7]' : 'text-current'} />
        <span>{label}</span>
      </Link>

      {DASHBOARD_NAV_GROUPS.map((group) => {
        const GroupIcon = group.icon;
        const isOpen = expandedGroupIds.has(group.id) || activeGroupId === group.id;
        const groupHasActive = group.items.some((item) => isDashboardNavLeafActive(pathname, item.href));
        const submenuId = `dashboard-nav-${group.id}`;

        return (
          <div key={group.id} className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-all duration-200 ${
                groupHasActive
                  ? 'border-[rgba(0,0,0,0.06)] bg-[rgba(17,17,17,0.04)] font-medium text-[#1f2937]'
                  : 'border-transparent text-[#6b7280] hover:border-[rgba(0,0,0,0.08)] hover:bg-[rgba(17,17,17,0.06)] hover:text-[#1f2937]'
              }`}
              aria-expanded={isOpen}
              aria-controls={submenuId}
            >
              <GroupIcon
                size={16}
                className={groupHasActive ? 'text-[#111827]' : 'text-current'}
              />
              <span className="min-w-0 flex-1 truncate">{group.label}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-[#9ca3af] transition-transform duration-200 ${
                  isOpen ? 'rotate-0' : '-rotate-90'
                }`}
                aria-hidden
              />
            </button>
            {isOpen ? (
              <div
                id={submenuId}
                className="ml-2 flex flex-col gap-0.5 border-l border-[#e5e5e5] pl-2"
                role="group"
                aria-label={group.label}
              >
                {group.items.map(({ key: itemKey, label: itemLabel, icon: ItemIcon, href }) => {
                  const itemActive = isDashboardNavLeafActive(pathname, href);
                  return (
                    <Link
                      key={itemKey}
                      href={href}
                      onClick={() => onNavigate?.()}
                      className={navLinkClass(itemActive, true)}
                    >
                      <ItemIcon
                        size={14}
                        className={itemActive ? 'text-[#f5f5f7]' : 'text-current'}
                      />
                      <span className="leading-snug">{itemLabel}</span>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex shrink-0 items-center gap-3 px-2 py-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo.svg" alt="Viking Tin" className="h-full w-full object-contain" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-tight">Viking Analytics</p>
        <p className="text-xs text-[#6b7280]">E-commerce Suite</p>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mobileNavPath, setMobileNavPath] = useState<string | null>(null);
  const mobileNavOpen = mobileNavPath === pathname;
  const currentMeta = pathname.startsWith('/dashboard/analytics/product/')
    ? {
        title: 'Product buyers',
        description: 'Completed orders by UTC month and day for this product',
      }
    : pathname.startsWith('/dashboard/analytics/bundle/')
      ? {
          title: 'Bundle buyers',
          description: 'Completed orders by UTC month and day for this bundle',
        }
      : pathname.startsWith('/dashboard/analytics/special-offer/')
        ? {
            title: 'Special offer buyers',
            description: 'Completed orders by UTC month and day for this special offer',
          }
        : (DASHBOARD_PAGE_META[pathname] ?? DASHBOARD_PAGE_META['/dashboard']);
  const showPageHeader = pathname !== '/dashboard';

  const handleLogout = () => {
    setMobileNavPath(null);
    dispatch(logout());
    router.replace('/admin/login');
  };

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavPath(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileNavOpen]);

  return (
    <main className="min-h-screen bg-[#f7f7f7] text-[#111111] font-[Inter,ui-sans-serif,system-ui,sans-serif]">
      <div className="mx-auto flex min-w-0 max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen min-h-0 w-64 shrink-0 border-r border-[#e5e5e5] bg-[#F7F7F7] p-4 md:flex md:min-h-0 md:flex-col md:gap-4">
          <SidebarBrand />
          <DashboardNavLinks pathname={pathname} />
        </aside>

        {/* Slide-out nav: stays mounted under md for transform transitions; inert when closed */}
        <div
          className={`fixed inset-0 z-100 md:hidden ${
            mobileNavOpen ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
          inert={mobileNavOpen ? undefined : true}
          aria-hidden={!mobileNavOpen}
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            className={`absolute inset-0 bg-[#0a0a0a]/45 backdrop-blur-[2px] transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              mobileNavOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setMobileNavPath(null)}
          />
          <div
            id="dashboard-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard menu"
            className={`absolute left-0 top-0 flex h-dvh max-h-dvh min-h-0 w-[min(20rem,calc(100vw-0.75rem))] flex-col gap-3 border-r border-[#e5e5e5] bg-[#F7F7F7] shadow-[8px_0_32px_-12px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out motion-reduce:transition-none sm:gap-4 sm:w-64 ${
              mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
            } pt-[max(1rem,env(safe-area-inset-top))] pr-4 pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]`}
          >
            <div className="flex shrink-0 items-center justify-between gap-2">
              <SidebarBrand />
              <button
                type="button"
                onClick={() => setMobileNavPath(null)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e5e5e5] bg-white text-[#374151] transition-colors hover:bg-[#f8fafc] active:bg-[#f1f5f9] sm:h-10 sm:w-10"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <DashboardNavLinks pathname={pathname} onNavigate={() => setMobileNavPath(null)} />
          </div>
        </div>

        <section className="min-w-0 flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="min-w-0 space-y-4 sm:space-y-6">
            <section className="sticky top-0 z-20 rounded-2xl bg-[#f7f7f7]/95 px-0 py-2 backdrop-blur-sm sm:px-2">
              <div className="flex min-w-0 w-full items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileNavPath(pathname)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#374151] transition-colors hover:bg-[#f8fafc] md:hidden"
                  aria-expanded={mobileNavOpen}
                  aria-controls="dashboard-mobile-nav"
                  aria-label="Open navigation menu"
                >
                  <Menu size={20} />
                </button>
                <div className="min-w-0 flex-1">
                  <Suspense
                    fallback={
                      <div className="h-11 w-full rounded-full border border-[#e5e5e5] bg-white" />
                    }
                  >
                    <DashboardGlobalSearch />
                  </Suspense>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#e5e5e5] bg-white px-4 text-sm font-medium text-[#374151] transition-colors hover:bg-[#f8fafc] hover:text-[#111827]"
                >
                  <LogOut size={16} aria-hidden />
                  Logout
                </button>
              </div>
            </section>

            <section className="min-w-0 space-y-4 rounded-2xl border border-[#e5e5e5] bg-[#FFFFFF] p-3 sm:space-y-6 sm:p-4 md:p-5">
              {showPageHeader ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                      {currentMeta.title}
                    </h1>
                    <p className="mt-1 text-sm text-[#6b7280]">{currentMeta.description}</p>
                  </div>
                </div>
              ) : null}

              {children}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
