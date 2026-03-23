'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Sparkles, GitBranch, Layers, Key, Palette, Users, CheckCircle, Star, ChevronRight, Zap, Shield, Globe, BarChart3, Rocket, Cpu } from 'lucide-react';
import { FEATURES, PRICING_TIERS, HOW_IT_WORKS, TESTIMONIALS } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const FEATURE_ICONS = [<Sparkles key={0} size={24} />, <Layers key={1} size={24} />, <GitBranch key={2} size={24} />, <Key key={3} size={24} />, <Palette key={4} size={24} />, <Users key={5} size={24} />];
const STEP_ICONS = [<BarChart3 key={0} size={28} />, <Zap key={1} size={28} />, <Globe key={2} size={28} />];

const LANGUAGES = ['TypeScript', 'Python', 'JavaScript', 'Go', 'Rust', 'Java', 'Ruby', 'C++', 'Swift', 'Kotlin', 'PHP', 'Scala', 'Dart', 'C#', 'Elixir', 'Haskell'];

export default function HomePage() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => setCount(c => c < 12847 ? c + Math.floor(Math.random() * 200) + 50 : 12847), 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Navbar />
      <main className="overflow-hidden bg-background text-foreground">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,hsl(var(--primary)/0.1),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <Badge variant="secondary" className="px-4 py-1.5 gap-2 text-xs font-semibold tracking-wide uppercase">
                <Sparkles size={14} className="text-primary" /> AI-Powered Documentation Engine
              </Badge>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6"
            >
              Transform Code into<br />
              <span className="text-primary">Beautiful Documentation</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl text-center mb-10 leading-relaxed"
            >
              Generate professional, comprehensive docs from any codebase in minutes. With interactive diagrams, API references, and architecture overviews.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 w-full"
            >
              <Button size="lg" className="rounded-full px-8 text-base h-12 shadow-md hover:shadow-lg transition-all" asChild>
                <Link href="/signup">
                  Start Free <ArrowRight size={18} className="ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 border-border/50 hover:bg-accent transition-all" asChild>
                <Link href="/dashboard">
                  View Demo <ChevronRight size={18} className="ml-2" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 border border-border bg-card/50 py-6 px-12 rounded-3xl backdrop-blur-sm shadow-sm"
            >
              <div className="text-center">
                <span className="block text-3xl font-black mb-1">{count.toLocaleString()}+</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Repos Documented</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-border"></div>
              <div className="text-center">
                <span className="block text-3xl font-black mb-1">50+</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Languages Supported</span>
              </div>
              <div className="hidden md:block w-px h-12 bg-border"></div>
              <div className="text-center">
                <span className="block text-3xl font-black mb-1">6</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AI Providers</span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Code Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="relative z-10 w-full max-w-5xl mx-auto mt-20 px-4"
          >
            <Card className="border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/30">
                <div className="flex gap-1.5 mr-4">
                  <div className="w-3 h-3 rounded-full bg-destructive/50 border border-destructive/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50 border border-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500/20"></div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center justify-center flex-1 pr-14 select-none">
                  <Cpu size={12} className="mr-2 opacity-70"/> CodeViki Auto-Generator
                </div>
              </div>
              <div className="flex flex-col md:flex-row min-h-[350px]">
                <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-border/60 p-4 bg-muted/10">
                  <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <Button variant="secondary" size="sm" className="justify-start gap-2 h-8 text-xs font-semibold"><Layers size={14} /> Overview</Button>
                    <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"><GitBranch size={14} /> Architecture</Button>
                    <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"><Zap size={14} /> API Reference</Button>
                    <Button variant="ghost" size="sm" className="justify-start gap-2 h-8 text-xs font-semibold text-muted-foreground hover:text-foreground"><Shield size={14} /> Auth Flow</Button>
                  </div>
                </div>
                <div className="flex-1 p-8 lg:p-12 relative overflow-hidden group">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1, delayChildren: 1 }}
                    className="space-y-6"
                  >
                    <motion.div initial={{ width: 0 }} animate={{ width: "40%" }} transition={{ duration: 1 }} className="h-4 bg-primary/20 rounded-full max-w-[200px]"></motion.div>
                    
                    <div className="space-y-3">
                      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.2 }} className="h-2 bg-foreground/10 rounded-full origin-left"></motion.div>
                      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.3 }} className="h-2 bg-foreground/10 rounded-full w-[90%] origin-left"></motion.div>
                      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.4 }} className="h-2 bg-foreground/10 rounded-full w-[80%] origin-left"></motion.div>
                    </div>
                    
                    <div className="p-6 rounded-xl bg-muted/40 border border-border/50 font-mono text-xs mt-10 shadow-inner">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                        <span className="text-muted-foreground">src/api/handler.ts</span>
                      </div>
                      <div className="space-y-2.5 pl-4 border-l-2 border-primary/20">
                        <div className="h-2 bg-primary/30 w-3/4 rounded-full"></div>
                        <div className="h-2 bg-primary/15 w-1/2 rounded-full"></div>
                        <div className="h-2 bg-primary/10 w-1/4 rounded-full"></div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="py-24 relative" id="features">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <Badge variant="outline" className="mb-6 px-4 py-1 gap-2 text-xs font-bold border-primary/50 text-primary uppercase tracking-widest bg-primary/5">
                <Sparkles size={14} /> Features
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Everything you need for<br /><span className="text-primary">world-class documentation</span></h2>
              <p className="text-lg text-muted-foreground leading-relaxed">From AI-powered analysis to beautiful output, CodeViki handles the entire documentation pipeline seamlessly.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((feature, i) => (
                <Card key={i} className="p-8 border-border/50 bg-card hover:bg-muted/30 hover:border-primary/40 transition-all duration-300 group shadow-sm hover:shadow-md">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {FEATURE_ICONS[i]}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-muted/30 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <Badge variant="outline" className="mb-6 px-4 py-1 gap-2 text-xs font-bold border-yellow-500/50 text-yellow-600 dark:text-yellow-500 uppercase tracking-widest bg-yellow-500/5">
                <Rocket size={14} /> Workflow
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Three steps to<br /><span className="text-yellow-600 dark:text-yellow-500">perfect documentation</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
              <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-px bg-border z-0"></div>
              
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-20 h-20 rounded-full bg-background border-2 border-border shadow-sm flex items-center justify-center mb-8 group-hover:border-primary transition-colors">
                    <span className="text-white bg-primary p-2 rounded-full">{STEP_ICONS[i]}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm max-w-[250px]">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Languages Marquee */}
        <section className="py-20 border-b border-border/50">
          <div className="max-w-7xl mx-auto px-6 mb-12">
            <div className="text-center">
              <h2 className="text-sm font-bold text-muted-foreground flex items-center justify-center gap-3 uppercase tracking-[0.2em]"><Globe size={18} className="text-primary"/> Universal Language Support</h2>
            </div>
          </div>
          <div className="relative w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
            <div className="flex w-max animate-marquee space-x-4">
              {[...LANGUAGES, ...LANGUAGES, ...LANGUAGES].map((lang, i) => (
                <Badge key={i} variant="secondary" className="px-6 py-2.5 rounded-full text-sm font-bold border-border/50 text-foreground/80 hover:text-primary hover:border-primary/30 cursor-default transition-all shadow-sm">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <Badge variant="outline" className="mb-6 px-4 py-1 gap-2 text-xs font-bold border-green-500/50 text-green-600 dark:text-green-500 uppercase tracking-widest bg-green-500/5">
                <Star size={14} /> Wall of Love
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Loved by <span className="text-green-600 dark:text-green-500">developers</span></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <Card key={i} className="p-8 border-border/50 flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm">
                  <div>
                    <div className="flex gap-0.5 mb-6">
                      {Array(t.rating).fill(0).map((_, si) => <Star key={si} size={14} className="fill-yellow-500 text-yellow-500" />)}
                    </div>
                    <p className="text-foreground/90 text-[15px] leading-relaxed mb-10 font-medium">"{t.text}"</p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-border pt-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm tracking-tight">{t.name}</div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t.role}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-24 bg-muted/30 border-t border-border/50 relative" id="pricing">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <Badge variant="outline" className="mb-6 px-4 py-1 gap-2 text-xs font-bold border-primary/50 text-primary uppercase tracking-widest bg-primary/5">
                <Zap size={14} /> Pricing
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Simple, transparent <span className="text-primary">pricing</span></h2>
              <p className="text-lg text-muted-foreground font-medium">Choose the plan that fits your vision.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {PRICING_TIERS.map((tier, i) => (
                <Card key={i} className={`p-8 rounded-3xl relative flex flex-col transition-all duration-300 ${tier.popular ? 'border-primary ring-1 ring-primary/50 shadow-xl lg:scale-105 z-10' : 'border-border/60 shadow-sm'}`}>
                  {tier.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                      Most Popular
                    </div>
                  )}
                  
                  <div className="mb-10 text-center">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">{tier.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                      <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{tier.price === '$0' ? '/forever' : '/month'}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <ul className="space-y-4 mb-10">
                      {tier.features.map((f, fi) => (
                        <li key={fi} className="flex items-start gap-3 text-sm font-medium">
                          <CheckCircle size={16} className="text-primary mt-1 shrink-0" />
                          <span className="leading-snug">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <Button variant={tier.popular ? "default" : "outline"} className={`w-full py-6 rounded-2xl font-black text-sm uppercase tracking-widest ${!tier.popular && 'border-border/50'}`} asChild>
                    <Link href="/signup">{tier.cta}</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="max-w-5xl mx-auto px-6">
            <Card className="relative p-12 md:p-20 text-center border-none bg-primary text-primary-foreground shadow-2xl rounded-[3rem] overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>
              
              <div className="relative z-10 flex flex-col items-center">
                <h2 className="text-3xl md:text-6xl font-black mb-8 tracking-tighter">Ready to document?</h2>
                <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-12 font-medium">
                  Join thousands of developers using AI-powered documentation. Start generating beautiful, interactive docs today.
                </p>
                <Button variant="secondary" size="lg" className="px-10 py-7 rounded-2xl font-black text-lg h-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-primary" asChild>
                  <Link href="/signup">
                    Get Started Free <ArrowRight size={20} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
