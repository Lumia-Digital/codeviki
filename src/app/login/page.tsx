'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Github, Mail, Lock, ArrowRight, Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
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
    <div className="min-h-screen flex items-center justify-center p-6 relative bg-background selection:bg-primary/30">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(108,92,231,0.05)_0%,transparent_50%)] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[400px] w-full"
      >
        <div className="mb-6 flex justify-start">
          <Link 
            href="https://lumiadigital.site" 
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors bg-background/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border/60"
          >
            <ArrowLeft size={14} /> Back to Website
          </Link>
        </div>
        <Card className="border-border/60 shadow-2xl shadow-primary/5 bg-card/50 backdrop-blur-xl overflow-hidden">
          <CardHeader className="text-center pt-10 pb-8">
            <div className="flex justify-center mb-6">
              <Logo showText={false} className="scale-125" />
            </div>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">CodeViki Login</CardTitle>
            <CardDescription className="font-medium text-muted-foreground">Access your decentralized documentation hub</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
                <span className="bg-card px-3 text-muted-foreground">secure protocol</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-bold flex items-center gap-2">
                <Sparkles size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-black ml-1 opacity-70">Email Address</Label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="name@domain.com"
                    className="pl-12 h-12 rounded-xl bg-background/50 border-border/60 font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label className="text-[10px] uppercase tracking-widest font-black opacity-70">Secret Access Key</Label>
                  <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity">Reset</Link>
                </div>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••"
                    className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/60 font-bold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
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
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>Identify <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></>}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pb-10 pt-2 flex justify-center border-t border-border/40 mt-6 bg-muted/30">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              No account? <Link href="/signup" className="text-primary hover:underline underline-offset-4">Create terminal</Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
