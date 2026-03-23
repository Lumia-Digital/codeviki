'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { CheckCircle, ArrowUpRight, ArrowRight, History as HistoryIcon, Zap, Download, Sparkles, Loader2, Settings as SettingsIcon, RefreshCw, Crown, Rocket, LogOut, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import confetti from 'canvas-confetti';

// Success overlay modal
function UpgradeSuccessOverlay({ tier, onClose }: { tier: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative bg-card border border-primary/30 rounded-[2.5rem] p-10 max-w-md mx-4 text-center shadow-[0_0_50px_rgba(var(--primary),0.2)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 blur-[80px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary/10 blur-[80px] rounded-full" />

          <motion.div
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/40 flex items-center justify-center shadow-lg shadow-primary/20"
          >
            <Crown className="w-12 h-12 text-primary" />
          </motion.div>

          <h2 className="text-3xl font-black uppercase tracking-tight text-foreground mb-3">
            Tier Synchronized
          </h2>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Protocol: {tier} Node</span>
          </div>
          
          <p className="text-muted-foreground text-sm font-medium mb-8 leading-relaxed">
            Your identity has been verified in the Stripe ledger. Premium resource allocations are now active on your node.
          </p>

          <div className="space-y-4 mb-10 text-left bg-muted/30 p-6 rounded-2xl border border-border/40">
            {tier === 'pro' && (
              <>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><Rocket size={14} className="text-primary" /></div>
                  15 Projects Capacity
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles size={14} className="text-primary" /></div>
                  50,000 AI API Calls
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><Zap size={14} className="text-primary" /></div>
                  Priority Neural Queue
                </div>
              </>
            )}
            {tier === 'enterprise' && (
              <>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><Rocket size={14} className="text-primary" /></div>
                  Unlimited Project Cells
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles size={14} className="text-primary" /></div>
                  500,000 AI API Calls
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><Zap size={14} className="text-primary" /></div>
                  Dedicated Infrastructure
                </div>
              </>
            )}
          </div>

          <Button
            onClick={onClose}
            className="w-full bg-primary hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] h-14 rounded-2xl shadow-xl shadow-primary/30 group"
          >
            Deploy Applications <ArrowUpRight size={16} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BillingPage() {
  const { data: session, update } = useSession();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [realTimeStats, setRealTimeStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState('');

  const updateTriggered = useRef(false);

  const fetchRealTimeStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const res = await fetch('/api/user/stats');
      if (res.ok) {
        const data = await res.json();
        setRealTimeStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch real-time stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const handleCancelSubscription = async (cancel: boolean) => {
    setIsCancelLoading(true);
    setSuccessMessage('');
    try {
      const res = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancel }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(`Protocol ${cancel ? 'Cancellation' : 'Reactivation'} Sequence Successful.`);
        await fetchRealTimeStats();
        await update(); // Refresh NextAuth session
      } else {
        throw new Error(data.error || 'Failed to update subscription');
      }
    } catch (err: any) {
      console.error('Cancellation error:', err);
      alert(`Protocol error: ${err.message}`);
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleSync = async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetch('/api/stripe/sync', { method: 'POST' });
      const data = await res.json();
      
      if (data.synced) {
        // Refresh local stats immediately
        await fetchRealTimeStats();

        // If the tier changed or we are specifically syncing after success, reload
        if (data.tier !== currentTier || silent) {
          sessionStorage.setItem('codewiki_upgraded_tier', data.tier);
          window.location.href = '/settings/billing?upgraded=true';
        } else {
          // Just update the session client-side if no tier change detected
          await update();
          if (!silent) setSuccessMessage(`Protocol Synchronized: ${data.tier.toUpperCase()}`);
        }
      } else if (!silent) {
        alert('No active subscription found to synchronize.');
      }
    } catch (err) {
      console.error('Sync failed:', err);
      if (!silent) alert('Synchronization sequence failed. Please check your connection.');
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  const fireConfetti = useCallback(() => {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);
  
  // ... (keeping handleUpgrade and handleManageSubscription)
  
  const handleUpgrade = async (tier: string) => {
    setIsUpgrading(true);
    setSuccessMessage('');
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, interval: billingInterval }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Upgrade failed:', err);
      alert(`Payment error: ${err.message}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to open billing portal');
      }
    } catch (err: any) {
      console.error('Portal failed:', err);
      alert(`Portal error: ${err.message}`);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const fetchInvoices = useCallback(async () => {
    setIsLoadingInvoices(true);
    try {
      const res = await fetch('/api/stripe/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Initial fetch of real-time stats
    fetchRealTimeStats();

    // Handle celebration after hard reload
    if (params.get('upgraded') && !updateTriggered.current) {
      updateTriggered.current = true;
      const tier = sessionStorage.getItem('codewiki_upgraded_tier') || 'pro';
      sessionStorage.removeItem('codewiki_upgraded_tier');
      window.history.replaceState({}, '', window.location.pathname);

      setUpgradedTier(tier);
      setShowUpgradeModal(true);
      fireConfetti();
    }

    // Handle initial redirect from Stripe
    if (params.get('success') && !updateTriggered.current) {
      updateTriggered.current = true;
      window.history.replaceState({}, '', window.location.pathname);
      
      // Attempt immediate sync + reload
      handleSync(true);
    }

    fetchInvoices();
  }, [fetchInvoices, fetchRealTimeStats, fireConfetti]);

  const user = session?.user as any;
  // Use real-time stats if available, fallback to session, then default
  const currentTier = (realTimeStats?.tier || user?.subscriptionTier || 'free').toLowerCase();

  const usageData = {
    projects: {
      used: realTimeStats?.usage?.projects ?? user?.usageProjects ?? 0,
      limit: realTimeStats?.limits?.projects ?? user?.limitProjects ?? 3,
      label: 'Projects'
    },
    apiCalls: {
      used: realTimeStats?.usage?.apiCalls ?? user?.usageApiCalls ?? 0,
      limit: realTimeStats?.limits?.apiCalls ?? user?.limitApiCalls ?? 1000,
      label: 'AI API Calls'
    },
  };

  const projectsPercent = Math.min((usageData.projects.used / usageData.projects.limit) * 100, 100);
  const apiPercent = Math.min((usageData.apiCalls.used / usageData.apiCalls.limit) * 100, 100);

  return (
    <>
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeSuccessOverlay
            tier={upgradedTier}
            onClose={() => setShowUpgradeModal(false)}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary bg-primary/5 px-3 py-1 w-fit">Financial Protocol</Badge>
            <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">Billing & Plans</h1>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl">Manage your subscription tier and monitor resource allocation.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => handleSync(false)}
              disabled={isSyncing}
              variant="outline"
              className="border-border/50 text-muted-foreground font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl hover:bg-muted/10 transition-colors"
            >
              {isSyncing ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
              Sync Protocol
            </Button>

            {currentTier !== 'free' && (
              <Button
                onClick={handleManageSubscription}
                disabled={isPortalLoading}
                variant="outline"
                className="border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl hover:bg-primary/5 shadow-lg shadow-primary/5"
              >
                {isPortalLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : <SettingsIcon size={16} className="mr-2" />}
                Manage Protocol
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Resource Usage Monitoring */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
            <CardHeader className="pb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                <CardTitle className="text-xl font-black uppercase tracking-tight">Active Allocation</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground font-medium">Real-time telemetry of your project resources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                        <Zap size={14} className="text-primary" /> Active Projects
                      </p>
                      <p className="text-2xl font-black text-foreground mt-1">{usageData.projects.used} / {usageData.projects.limit}</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{Math.round(projectsPercent)}% Utilized</p>
                  </div>
                  <Progress value={projectsPercent} className="h-2 bg-muted/40" />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                        <Sparkles size={14} className="text-primary" /> AI API Calls
                      </p>
                      <p className="text-2xl font-black text-foreground mt-1">{usageData.apiCalls.used.toLocaleString()} / {usageData.apiCalls.limit.toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{Math.round(apiPercent)}% Utilized</p>
                  </div>
                  <Progress value={apiPercent} className="h-2 bg-muted/40" />
                </div>

                <div className="flex items-center gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl md:col-span-2 shadow-inner">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                  />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Protocol Active: {currentTier.toUpperCase()} NODE</p>
                    {currentTier !== 'free' && (
                      <p className="text-[9px] font-bold text-primary/70 uppercase mt-0.5">Cycle End: {user?.stripeCurrentPeriodEnd ? new Date(user.stripeCurrentPeriodEnd).toLocaleDateString() : 'N/A'}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Interval Toggle */}
          <div className="flex flex-col items-center justify-center space-y-6 pb-4">
            <div className="flex items-center p-1.5 bg-muted/30 border border-border/40 rounded-2xl shadow-inner">
              <button
                onClick={() => setBillingInterval('month')}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  billingInterval === 'month' ? "bg-background text-primary shadow-lg border border-border/60" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Monthly Settings
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={cn(
                  "px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2",
                  billingInterval === 'year' ? "bg-background text-primary shadow-lg border border-border/60" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Annual Protocol
                <span className="text-[8px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black">-20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                id: 'free',
                name: 'Free Tier',
                price: '$0',
                desc: 'Base Protocol',
                features: ['3 Projects Limit', '1,000 AI API Calls', 'Standard Support', 'Basic Components']
              },
              {
                id: 'pro',
                name: 'Pro Node',
                price: billingInterval === 'month' ? '$19' : '$190',
                desc: billingInterval === 'month' ? 'Advanced Access' : 'Full Cycle Access',
                features: ['15 Projects Limit', '50,000 AI API Calls', 'Priority AI Queue', 'Advanced Export Options', 'Custom Themes'],
                recommended: true
              },
              {
                id: 'enterprise',
                name: 'Enterprise',
                price: billingInterval === 'month' ? '$49' : '$490',
                desc: billingInterval === 'month' ? 'Full Protocol' : 'Eternal Protocol',
                features: ['Unlimited Projects', '500,000 AI API Calls', 'Dedicated Infrastructure', 'SLA Support', 'Unlimited Diagrams']
              },
            ].map((plan) => {
              const isCurrent = currentTier === plan.id;
              return (
                <Card key={plan.id} className={cn(
                  "border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 relative overflow-hidden group flex flex-col transition-all duration-500 hover:translate-y-[-4px]",
                  plan.recommended && !isCurrent && "border-primary/40 ring-1 ring-primary/20",
                  isCurrent && "border-primary bg-primary/[0.03] ring-2 ring-primary shadow-[0_0_30px_rgba(var(--primary),0.05)]"
                )}>
                  {plan.id === 'pro' && !isCurrent && (
                    <div className="absolute top-0 right-0 py-2 px-5 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-[0.2em] rounded-bl-2xl z-20 shadow-lg">
                      Recommended
                    </div>
                  )}

                  <CardHeader className="relative z-10 pt-8">
                    {isCurrent && (
                      <Badge className="w-fit bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 mb-5 shadow-lg shadow-primary/20">Active Protocol</Badge>
                    )}
                    <CardTitle className="text-3xl font-black uppercase tracking-tight">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.2em] mt-1">{plan.desc}</CardDescription>
                  </CardHeader>

                  <CardContent className="relative z-10 py-8 flex-1 space-y-8">
                    <div className="flex items-baseline gap-2">
                      <p className="text-5xl font-black text-foreground tracking-tighter">{plan.price}</p>
                      <span className="text-xs text-muted-foreground font-black uppercase tracking-widest">
                        / {billingInterval === 'month' ? 'month' : 'year'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {plan.features.map(feature => (
                        <div key={feature} className="flex items-center gap-3">
                          <CheckCircle size={16} className={cn("shrink-0", isCurrent ? "text-primary" : "text-primary/40")} />
                          <span className="text-xs font-semibold text-foreground/70">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {isCurrent && successMessage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                      >
                        <CheckCircle size={16} className="animate-bounce" /> {successMessage}
                      </motion.div>
                    )}
                  </CardContent>

                  {/* Card Footer Actions */}
                  <div className="relative z-10 px-8 pb-8 pt-2 flex flex-col gap-4 w-full border-t border-border/10 mt-auto">
                    {isCurrent ? (
                      <div className="flex flex-col w-full gap-4">
                        <Button 
                          disabled={isPortalLoading || isCancelLoading || plan.id === 'free'} 
                          className={cn(
                            "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] relative overflow-hidden group/btn border-0 shadow-2xl",
                            realTimeStats?.stripeCancelAtPeriodEnd 
                              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20" 
                              : "bg-foreground text-background hover:bg-foreground/90"
                          )}
                          onClick={() => {
                            if (realTimeStats?.stripeCancelAtPeriodEnd) {
                              handleCancelSubscription(false);
                            } else {
                              handleManageSubscription(); 
                            }
                          }}
                        >
                          {isPortalLoading || isCancelLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              {realTimeStats?.stripeCancelAtPeriodEnd ? (
                                <span className="flex items-center gap-2 justify-center"><Zap size={14} fill="currentColor" /> Reactivate Protocol</span>
                              ) : plan.id === 'free' ? (
                                'Current Node'
                              ) : (
                                'Billed on Protocol'
                              )}
                              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                            </>
                          )}
                        </Button>
                        
                        {isCurrent && plan.id !== 'free' && !realTimeStats?.stripeCancelAtPeriodEnd && (
                          <button
                            onClick={() => handleCancelSubscription(true)}
                            disabled={isCancelLoading}
                            className="w-full text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 hover:text-destructive hover:tracking-[0.5em] transition-all flex items-center justify-center gap-2 py-3 border border-border/40 rounded-xl hover:border-destructive/30 group/cancel"
                          >
                            {isCancelLoading ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <LogOut size={10} className="group-hover/cancel:-translate-x-1 transition-transform" />
                            )}
                            Deactivate Protocol
                          </button>
                        )}
                      </div>
                    ) : (
                      <Button 
                        disabled={isUpgrading}
                        onClick={() => handleUpgrade(plan.id)}
                        variant={plan.recommended ? "default" : "outline"}
                        className={cn(
                          "w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all relative overflow-hidden group/btn",
                          plan.recommended ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 border-0" : "border-border/60 hover:bg-accent/10"
                        )}
                      >
                        {isUpgrading ? (
                          <Loader2 size={16} className="animate-spin" /> 
                        ) : (
                          <>
                            Initiate Upgrade
                            <ArrowRight size={14} className="ml-2 group-hover/btn:translate-x-2 transition-transform" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

      {/* Expiry Warning Banner */}
      {realTimeStats?.stripeCancelAtPeriodEnd && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-24 mb-12 p-10 rounded-[2.5rem] bg-destructive/5 border border-destructive/20 backdrop-blur-2xl relative overflow-hidden group z-30 shadow-2xl"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center text-destructive shrink-0 shadow-inner">
                <Clock size={32} />
              </div>
              <div className="text-center lg:text-left">
                <h3 className="text-xl font-black uppercase tracking-tighter text-foreground flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  Protocol Termination Scheduled
                  <Badge variant="destructive" className="animate-pulse shadow-lg shadow-destructive/20 font-black uppercase tracking-[0.2em] text-[9px] px-3 py-1">Pending Downgrade</Badge>
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-2 leading-relaxed">
                  Your Pro Node access will remain active until <span className="text-foreground font-black px-2 py-0.5 bg-foreground/5 rounded-md">{realTimeStats.stripeCurrentPeriodEnd ? new Date(realTimeStats.stripeCurrentPeriodEnd).toLocaleDateString() : 'the end of the cycle'}</span>. 
                  After this date, your workspace will revert to the Free Tier. Existing projects will be preserved, but new project creation will be limited.
                </p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] h-14 px-10 bg-destructive/20 text-destructive border border-destructive/30 hover:bg-destructive shadow-lg transition-all"
              onClick={() => handleCancelSubscription(false)}
              disabled={isCancelLoading}
            >
              {isCancelLoading ? <Loader2 size={16} className="animate-spin mr-3" /> : <Zap size={16} className="mr-3" fill="currentColor" />}
              Reactivate Protocol
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/10 blur-[100px] rounded-full -mr-32 -mt-32" />
        </motion.div>
      )}

      {/* Invoices Section */}
        <Card className="mt-16 border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
          <CardHeader className="pb-8 border-b border-border/20">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              <CardTitle className="text-xl font-black uppercase tracking-tight">Invoice History</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground font-medium">Archived logs of all resource acquisitions and settlements.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingInvoices ? (
              <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-primary/40" />
              </div>
            ) : invoices.length > 0 ? (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-muted/10 text-muted-foreground font-black uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">Internal ID</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Deployment Date</th>
                      <th className="px-8 py-5">Settlement</th>
                      <th className="px-8 py-5 text-right">Certificate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-8 py-5 font-bold font-mono text-foreground/60">{invoice.number}</td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-3 py-1",
                            invoice.status === 'paid' ? "bg-green-500/5 text-green-500 border-green-500/20" : "bg-orange-500/5 text-orange-500 border-orange-500/20"
                          )}>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 font-medium text-muted-foreground">{new Date(invoice.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                        <td className="px-8 py-5 font-black text-foreground text-sm">{invoice.amount.toLocaleString('en-US', { style: 'currency', currency: invoice.currency.toUpperCase() })}</td>
                        <td className="px-8 py-5 text-right">
                          <a
                            href={invoice.pdf}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary/70 font-black uppercase tracking-[0.2em] transition-all hover:gap-3"
                          >
                            Extract PDF <Download size={14} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-muted/20 border border-border/40 flex items-center justify-center">
                  <HistoryIcon size={32} className="text-muted-foreground/30" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">No transaction records found on the ledger.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
