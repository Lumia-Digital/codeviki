'use client';

import Link from 'next/link';
import { Github, Twitter, Mail, ArrowUpRight, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  return (
    <footer className="bg-muted/30 border-t border-border pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg group-hover:scale-105 transition-transform">
                <Sparkles size={20} />
              </div>
              <span className="text-xl font-black tracking-tighter">CodeViki</span>
            </Link>
            <p className="text-muted-foreground text-base leading-relaxed max-w-sm font-medium">
              AI-powered documentation for modern codebases. Transform your code into beautiful, comprehensive docs in minutes.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="GitHub" className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm">
                <Github size={18} />
              </a>
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm">
                <Twitter size={18} />
              </a>
              <a href="#" aria-label="Email" className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all border border-border shadow-sm">
                <Mail size={18} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-[0.2em] mb-4">Product</h4>
            <Link href="/#features" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Features</Link>
            <Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Pricing</Link>
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Dashboard</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Changelog</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-[0.2em] mb-4">Resources</h4>
            <Link href="#" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold group">
              Documentation <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link href="#" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold group">
              API Reference <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link href="#" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm font-semibold group">
              Blog <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Support</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-[0.2em] mb-4">Company</h4>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">About</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Privacy</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Terms</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors text-sm font-semibold">Contact</Link>
          </div>
        </div>

        <Separator className="bg-border/50 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <span>© {new Date().getFullYear()} CodeViki. All rights reserved.</span>
          <span className="flex items-center gap-2">Built with <span className="text-primary">AI</span> • Made for developers</span>
        </div>
      </div>
    </footer>
  );
}
