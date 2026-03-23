'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { FolderOpen, Plus, Settings, CreditCard, BarChart3, Zap, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';
import { ModeToggle } from '@/components/ModeToggle';
import { cn } from '@/lib/utils';
import { getTierLimits } from '@/lib/tiers';

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);

  const fetchRealTimeStats = useCallback(async () => {
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) {
        const data = await res.json();
        setRealTimeStats(data);
      }
    } catch (err) {
      console.error('Sidebar: Failed to fetch real-time stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchRealTimeStats();
    // Re-fetch on session changes or every 5s as a background heartbeat
    const interval = setInterval(fetchRealTimeStats, 5000);
    return () => clearInterval(interval);
  }, [fetchRealTimeStats, session]);

  const navItems = [
    { href: '/dashboard', label: 'Projects', icon: <FolderOpen size={18} /> },
    { href: '/dashboard/new', label: 'New Project', icon: <Plus size={18} /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={18} /> },
    { href: '/settings/billing', label: 'Billing', icon: <CreditCard size={18} /> },
  ];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarCollapsed ? 80 : 280,
          x: (isMobileMenuOpen || (mounted && window.innerWidth >= 1024)) ? 0 : -280
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-all duration-300 lg:transition-none",
          isMobileMenuOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className={cn(
          "h-16 flex items-center px-6 mb-4",
          isSidebarCollapsed ? "justify-center px-0" : "justify-between"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <Logo showText={!isSidebarCollapsed} />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => {
            // Use exact match for specific items like Settings vs Billing to avoid double highlighting
            // But allow prefix match for Dashboard and nested project paths
            const isActive = item.href === '/dashboard' 
              ? pathname === '/dashboard' || (pathname.startsWith('/dashboard/') && pathname !== '/dashboard/new')
              : pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "flex items-center gap-3 py-2 rounded-lg text-sm font-semibold transition-all group",
                  isSidebarCollapsed ? "justify-center px-0" : "px-3",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                )}
                title={isSidebarCollapsed ? item.label : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={cn(
                  "w-5 flex justify-center shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!isSidebarCollapsed && (
          <div className="mx-4 mb-6 p-4 rounded-xl bg-muted/50 border border-border/50 relative overflow-hidden group">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              <BarChart3 size={12} className="text-primary" /> System Metrics
            </div>
            
            <div className="space-y-3">
              {(() => {
                const user = session?.user as any;
                // Use real-time stats with session fallback
                const tier = (realTimeStats?.tier || user?.subscriptionTier || 'free').toLowerCase();
                const limits = realTimeStats?.limits || getTierLimits(tier);
                
                const projectLimit = limits.projects;
                const apiCallLimit = limits.apiCalls;
                
                const usageProjects = realTimeStats?.usage?.projects ?? user?.usageProjects ?? 0;
                const usageApiCalls = realTimeStats?.usage?.apiCalls ?? user?.usageApiCalls ?? 0;

                return (
                  <>
                    <div>
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1 font-bold">
                        <span>Projects</span>
                        <span className="text-foreground">
                          {usageProjects} / {projectLimit === Infinity ? '∞' : projectLimit}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${Math.min((usageProjects / projectLimit) * 100, 100)}%` }} 
                          transition={{ duration: 1 }} 
                          className={cn(
                            "h-full",
                            usageProjects >= projectLimit ? "bg-destructive" : "bg-primary"
                          )} 
                        />
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1 font-bold italic opacity-80">
                        <span>API Status</span>
                        <span className="text-primary animate-pulse">Live Tracking</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${Math.min((usageApiCalls / apiCallLimit) * 100, 100)}%` }} 
                          transition={{ duration: 1 }} 
                          className="h-full bg-primary" 
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {(realTimeStats?.tier || (session?.user as any)?.subscriptionTier || 'free').toLowerCase() === 'free' && (
              <div className="mt-4 pt-3 border-t border-border/30 flex flex-col items-center">
                <Link 
                  href="/settings/billing"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-primary/80 transition-all flex items-center gap-1.5 group/upgrade"
                >
                  Upgrade
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="p-3 border-t border-border mt-auto">
          <div className={cn(
            "flex flex-col gap-1",
            isSidebarCollapsed ? "items-center" : ""
          )}>
            <Button 
              variant="ghost" 
              size={isSidebarCollapsed ? "icon" : "sm"} 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
              className={cn(
                "hidden lg:flex text-muted-foreground font-semibold transition-all duration-300",
                isSidebarCollapsed ? "rounded-full" : "w-full justify-start gap-3 h-9 px-3"
              )}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> Collapse</>}
            </Button>
            
            <ModeToggle showLabel={!isSidebarCollapsed} />

            <Separator className="my-2" />

            <div className={cn(
              "flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group relative",
              isSidebarCollapsed ? "justify-center" : ""
            )}>
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md shrink-0 overflow-hidden">
                {realTimeStats?.user?.image ? (
                  <img src={realTimeStats.user.image} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  (realTimeStats?.user?.name?.[0] || session?.user?.name?.[0] || session?.user?.email?.[0] || 'U').toUpperCase()
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{realTimeStats?.user?.name || session?.user?.name || 'User'}</div>
                  <div className="text-[10px] text-muted-foreground truncate font-semibold uppercase tracking-tighter">{session?.user?.email || 'admin@codeviki.com'}</div>
                </div>
              )}
              {!isSidebarCollapsed && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => signOut({ callbackUrl: '/' })} 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <LogOut size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
