'use client';

import { useEffect, useState } from 'react';
import { User as UserIcon, Key, Settings as SettingsIcon, Eye, EyeOff, CheckCircle, Loader2, Camera, Shield, Bell, Zap, Save } from 'lucide-react';
import { AI_PROVIDERS } from '@/lib/mock-data';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    image: '',
    openaiKey: '',
    anthropicKey: '',
    googleKey: '',
    mistralKey: '',
    cohereKey: '',
    deepseekKey: '',
  });

  const [protocols, setProtocols] = useState({
    autoGenEnabled: true,
    codeContextEnabled: true,
    apiScannerEnabled: false,
    pushNotificationsEnabled: true,
  });

  const [showKey, setShowKey] = useState<string | null>(null);
  const [validating, setValidating] = useState<string | null>(null);
  const [validated, setValidated] = useState<string[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/settings');
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          image: data.image || '',
          openaiKey: data.openaiKey || '',
          anthropicKey: data.anthropicKey || '',
          googleKey: data.googleKey || '',
          mistralKey: data.mistralKey || '',
          cohereKey: data.cohereKey || '',
          deepseekKey: data.deepseekKey || '',
        });

        setProtocols({
          autoGenEnabled: data.autoGenEnabled ?? true,
          codeContextEnabled: data.codeContextEnabled ?? true,
          apiScannerEnabled: data.apiScannerEnabled ?? false,
          pushNotificationsEnabled: data.pushNotificationsEnabled ?? true,
        });
        
        // Mark keys as validated if they exist
        const alreadySetKeys = [];
        if (data.openaiKey) alreadySetKeys.push('openai');
        if (data.anthropicKey) alreadySetKeys.push('anthropic');
        if (data.googleKey) alreadySetKeys.push('google');
        if (data.mistralKey) alreadySetKeys.push('mistral');
        if (data.cohereKey) alreadySetKeys.push('cohere');
        if (data.deepseekKey) alreadySetKeys.push('deepseek');
        setValidated(alreadySetKeys);
      }
    } catch (err) {
      console.error('Fetch settings failure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess('');
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...protocols
        }),
      });

      if (res.ok) {
        await updateSession();
        setSaveSuccess('Security Protocols Synchronized');
        setTimeout(() => setSaveSuccess(''), 5000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidateKey = async (providerId: string) => {
    const key = (formData as any)[`${providerId}Key`];
    if (!key) return;
    
    setValidating(providerId);
    try {
      // Simulate validation call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setValidated(prev => Array.from(new Set([...prev, providerId])));
    } catch {
      alert('Validation failed');
    }
    setValidating(null);
  };

  const tabs = [
    { id: 'profile', label: 'Identity', icon: <UserIcon size={16} /> },
    { id: 'api-keys', label: 'Access Keys', icon: <Key size={16} /> },
    { id: 'preferences', label: 'Protocols', icon: <SettingsIcon size={16} /> },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Accessing Neural Profiles...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
        <div className="space-y-4">
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-[0.2em] border-primary/20 text-primary bg-primary/5 px-3 py-1 w-fit">Configuration Hub</Badge>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-foreground">Settings</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl">Manage your identity, security protocols, and system preferences.</p>
        </div>
        {saveSuccess && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-2 mb-2">
            <CheckCircle size={14} /> {saveSuccess}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        {/* Navigation Tabs */}
        <div className="xl:col-span-1">
          <nav className="flex flex-row xl:flex-col gap-1 p-1 bg-muted/30 border border-border/40 rounded-xl overflow-hidden">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id} 
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex-1 xl:flex-none border",
                    isActive 
                      ? "text-primary bg-background border-border/60 shadow-sm" 
                      : "text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className={isActive ? "text-primary" : "text-muted-foreground"}>{tab.icon}</span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="xl:col-span-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                    <CardHeader className="pb-6 bg-muted/10 border-b border-border/40">
                      <CardTitle className="text-lg font-black uppercase tracking-tight">Identity Profile</CardTitle>
                      <CardDescription className="text-[11px] font-bold text-muted-foreground uppercase opacity-70">Global identity across the CodeViki ecosystem.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8 space-y-8">
                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="relative shrink-0">
                          <Avatar className="h-24 w-24 border-2 border-border/40 shadow-inner overflow-hidden">
                            {formData.image ? (
                              <img src={formData.image} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                                {formData.name?.substring(0, 2).toUpperCase() || 'JD'}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            id="avatar-upload" 
                            onChange={handleImageUpload} 
                          />
                          <Button 
                            size="icon" 
                            variant="outline" 
                            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-background border-border shadow-lg hover:scale-110 transition-transform"
                            onClick={() => document.getElementById('avatar-upload')?.click()}
                          >
                            <Camera size={14} />
                          </Button>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-0.5">Full Name</Label>
                            <Input 
                              value={formData.name} 
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="h-11 border-border/50 bg-card/50 backdrop-blur-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all text-sm rounded-xl" 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest opacity-60 ml-0.5">Email System</Label>
                            <Input 
                              type="email" 
                              value={formData.email} 
                              disabled
                              className="h-11 border-border/50 bg-card/50 font-bold bg-muted/30 cursor-not-allowed text-sm rounded-xl" 
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t border-border/40 py-4 flex justify-end">
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="font-black uppercase tracking-widest text-[10px] h-11 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} className="mr-2" /> Synchronize Data</>}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {activeTab === 'api-keys' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                    <Zap size={18} className="text-primary shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-relaxed relative z-10">
                      Keys are encrypted locally and stored securely on your server node. <Link href="/settings/billing" className="underline underline-offset-4 decoration-2">Premium Security Enabled →</Link>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {AI_PROVIDERS.map(provider => {
                      const isValidated = validated.includes(provider.id);
                      const isValidating = validating === provider.id;
                      const keyField = `${provider.id}Key` as keyof typeof formData;
                      const hasKey = !!formData[keyField];
                      
                      return (
                        <Card key={provider.id} className={cn(
                          "border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 hover:border-primary/30 transition-all duration-300 overflow-hidden",
                          isValidated && "border-primary/30 bg-primary/10 shadow-primary/5"
                        )}>
                          <CardContent className="p-5">
                            <div className="flex flex-col md:flex-row gap-6 items-center">
                              <div className="flex items-center gap-4 shrink-0 w-full md:w-auto">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 border-border/40" style={{ backgroundColor: `${provider.color}10`, color: provider.color }}>
                                  <Key size={18} />
                                </div>
                                <div>
                                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                    {provider.name}
                                    {isValidated && <CheckCircle size={10} className="text-primary" />}
                                  </h3>
                                  <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{provider.models[0]} + others</p>
                                </div>
                              </div>
                              
                              <div className="flex-1 w-full space-y-2">
                                <div className="relative">
                                  <Input 
                                    type={showKey === provider.id ? 'text' : 'password'}
                                    placeholder="sk-..."
                                    value={formData[keyField]}
                                    onChange={e => setFormData({ ...formData, [keyField]: e.target.value })}
                                    className="h-10 bg-card/50 backdrop-blur-sm font-mono text-[11px] border-border/50 focus:ring-4 focus:ring-primary/10 transition-all rounded-xl pr-10"
                                  />
                                  <button 
                                    onClick={() => setShowKey(showKey === provider.id ? null : provider.id)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    {showKey === provider.id ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                </div>
                              </div>
                              
                              <Button 
                                size="sm"
                                disabled={!hasKey || isValidating || isValidated}
                                onClick={() => handleValidateKey(provider.id)}
                                className="h-10 w-full md:w-28 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                              >
                                {isValidating ? <Loader2 size={14} className="animate-spin" /> : isValidated ? "Verified" : "Verify"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving}
                      className="font-black uppercase tracking-widest text-[11px] h-12 px-10 rounded-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                    >
                      {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} className="mr-2" /> Commit Changes</>}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-4">
                   <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-xl shadow-black/5 overflow-hidden">
                    <CardHeader className="pb-4 bg-muted/10 border-b border-border/40">
                      <CardTitle className="text-lg font-black uppercase tracking-tight">System Protocols</CardTitle>
                      <CardDescription className="text-[11px] font-bold text-muted-foreground uppercase opacity-70">Control automated documentation behavior.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 divide-y divide-border/40">
                      {[
                        { id: 'autoGenEnabled', label: 'Autogeneration', desc: 'Synthesize architecture flows' },
                        { id: 'codeContextEnabled', label: 'Code Context', desc: 'Inject source snippets' },
                        { id: 'apiScannerEnabled', label: 'API Scanner', desc: 'Index REST endpoints' },
                        { id: 'pushNotificationsEnabled', label: 'Push Notifications', desc: 'Documentation updates' },
                      ].map((pref) => {
                        const isEnabled = (protocols as any)[pref.id];
                        return (
                          <div key={pref.id} className="flex items-center justify-between p-5 hover:bg-muted/5 transition-colors group">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{pref.label}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">{pref.desc}</p>
                            </div>
                            <button 
                              onClick={() => setProtocols({ ...protocols, [pref.id]: !isEnabled })}
                              className={cn(
                                "w-10 h-5 rounded-full cursor-pointer transition-all border p-0.5 relative",
                                isEnabled ? "bg-primary border-primary" : "bg-muted border-border/60"
                              )}
                            >
                              <div className={cn(
                                "w-3.5 h-3.5 bg-white rounded-full transition-all absolute top-1/2 -translate-y-1/2",
                                isEnabled ? "right-0.5" : "left-0.5"
                              )} />
                            </button>
                          </div>
                        );
                      })}
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t border-border/40 py-4 flex justify-end">
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="font-black uppercase tracking-widest text-[10px] h-11 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} className="mr-2" /> Save Protocols</>}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
