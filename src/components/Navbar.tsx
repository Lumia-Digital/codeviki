'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, FileCode, Layers, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ModeToggle';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/#features', icon: <Layers size={16} /> },
    { name: 'Pricing', href: '/#pricing', icon: <Zap size={16} /> },
    { name: 'Dashboard', href: '/dashboard', icon: <FileCode size={16} /> },
  ];

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled 
        ? "bg-background/80 backdrop-blur-md border-b border-border py-3" 
        : "bg-transparent py-5"
    )}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
            <Sparkles size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter">CodeViki</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/50 backdrop-blur-sm">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all",
                pathname === link.href 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              {link.icon} {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 mr-2">
            <ModeToggle />
            {session ? (
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })} className="text-muted-foreground font-semibold">
                  Sign Out
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
                  {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild className="font-semibold text-muted-foreground">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="rounded-full px-5 shadow-md">
                  <Link href="/signup">Get Started <ArrowRight size={16} className="ml-1" /></Link>
                </Button>
              </>
            )}
          </div>

          <button className="md:hidden text-foreground p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.icon} {link.name}
                </Link>
              ))}
              
              <div className="h-px bg-border my-2" />
              
              <div className="flex items-center justify-between px-4 mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Theme</span>
                <ModeToggle />
              </div>

              {session ? (
                <Button variant="destructive" size="lg" onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }} className="w-full rounded-xl font-bold">
                  Sign Out
                </Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="outline" size="lg" asChild className="w-full rounded-xl font-bold border-border/50">
                    <Link href="/login" onClick={() => setMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button size="lg" asChild className="w-full rounded-xl font-bold shadow-lg">
                    <Link href="/signup" onClick={() => setMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
