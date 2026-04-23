'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Github, Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle, Loader2, Sparkles, Zap, ArrowLeft } from 'lucide-react';
import { PRICING_TIERS } from '@/lib/mock-data';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        setIsLoading(false);
        return;
      }

      setIsOtpSent(true);
      setIsLoading(false);
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setIsLoading(false);
        return;
      }

      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError(signInRes.error);
        setIsLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background selection:bg-primary/30 py-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(108,92,231,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[640px] w-full"
      >
        <div className="mb-6 flex justify-start">
          <Link 
            href="https://codeviki.lumiadigital.site" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/60"
          >
            <ArrowLeft size={14} /> Back to Website
          </Link>
        </div>
        <Card className="border-border/60 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="text-center pt-10 pb-6">
            <div className="flex justify-center mb-6">
              <Logo showText={false} className="scale-125" />
            </div>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Access Registry</CardTitle>
            <CardDescription className="font-medium text-muted-foreground">Initialize your developer identity on CodeViki</CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Plan Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-4 bg-primary rounded-full" />
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Protocol Selection</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {PRICING_TIERS.map(tier => (
                  <button 
                    key={tier.name.toLowerCase()} 
                    onClick={() => setSelectedPlan(tier.name.toLowerCase())}
                    className={cn(
                      "text-left p-4 border rounded-2xl transition-all duration-300 relative overflow-hidden group",
                      selectedPlan === tier.name.toLowerCase() 
                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" 
                        : "border-border/60 bg-transparent hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <span className={cn("text-xs font-black uppercase tracking-widest", selectedPlan === tier.name.toLowerCase() ? "text-primary" : "text-foreground")}>{tier.name}</span>
                       <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/20 bg-primary/5 text-primary">
                         {tier.price}
                       </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {tier.features.slice(0, 2).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-tight">
                          <CheckCircle size={8} className="text-primary/70" /> {f}
                        </div>
                      ))}
                    </div>
                    {selectedPlan === tier.name.toLowerCase() && (
                      <motion.div layoutId="plan-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
                <span className="bg-card px-3 text-muted-foreground">Identity verification</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-3 border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
              >
                <Github size={18} /> GitHub
              </Button>
              <Button 
                variant="outline" 
                className="h-12 rounded-xl font-bold uppercase tracking-widest text-[10px] gap-3 border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
            </div>

            <form className="space-y-6" onSubmit={isOtpSent ? handleSignup : handleSendOtp}>
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {!isOtpSent ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-black ml-1 opacity-70">Alias Name</Label>
                      <div className="relative group">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="e.g. Satoshi"
                          className="pl-12 h-12 rounded-xl bg-background/50 border-border/60 font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-black ml-1 opacity-70">Email Address</Label>
                      <div className="relative group">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          type="email" 
                          placeholder="dev@domain.com"
                          className="pl-12 h-12 rounded-xl bg-background/50 border-border/60 font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-black ml-1 opacity-70">Access Token (Password)</Label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input 
                        type={showPassword ? 'text' : 'password'} 
                        placeholder="Min 8 characters"
                        className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/60 font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-14 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 mt-4 group" 
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Send Verification Code <Zap size={16} className="ml-2 group-hover:scale-110 transition-transform" /></>}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-[11px] font-bold text-center text-primary uppercase tracking-wider">
                        A 6-digit verification code has been sent to 
                        <br />
                        <span className="text-foreground">{email}</span>
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-black ml-1 opacity-70">Verification Code (OTP)</Label>
                      <div className="relative group">
                        <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          placeholder="000000"
                          maxLength={6}
                          className="pl-12 h-14 rounded-xl bg-background/50 border-border/60 font-black text-xl tracking-[0.5em] text-center focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                          value={otp}
                          onChange={e => setOtp(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-primary/20 group" 
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Complete Enrollment <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></>}
                    </Button>
                    <button 
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors py-2"
                    >
                      Edit details
                    </button>
                  </div>
                </>
              )}
            </form>
          </CardContent>

          <CardFooter className="pb-10 pt-2 flex justify-center border-t border-border/40 mt-6 bg-muted/30">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Enrolled already? <Link href="/login" className="text-primary hover:underline underline-offset-4 font-black">Authorized Sign-in</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
