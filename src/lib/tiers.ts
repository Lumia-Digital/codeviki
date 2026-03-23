export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface TierLimits {
  projects: number;
  apiCalls: number;
  teamMembers: number;
  features: {
    customAPIKeys: boolean;
    advancedDiagrams: boolean;
    exportMarkdown: boolean;
    exportPDF: boolean;
    exportHTML: boolean;
    autoChangeDetection: boolean;
    customThemes: boolean;
    whiteLabel: boolean;
    apiAccess: boolean;
  };
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    projects: 3,
    apiCalls: 1000,
    teamMembers: 1,
    features: {
      customAPIKeys: true,
      advancedDiagrams: false,
      exportMarkdown: true,
      exportPDF: false,
      exportHTML: false,
      autoChangeDetection: false,
      customThemes: false,
      whiteLabel: false,
      apiAccess: false,
    }
  },
  pro: {
    projects: 15,
    apiCalls: 50000,
    teamMembers: 3,
    features: {
      customAPIKeys: true,
      advancedDiagrams: true,
      exportMarkdown: true,
      exportPDF: true,
      exportHTML: true,
      autoChangeDetection: true,
      customThemes: true,
      whiteLabel: false,
      apiAccess: false,
    }
  },
  enterprise: {
    projects: Infinity,
    apiCalls: 500000,
    teamMembers: Infinity,
    features: {
      customAPIKeys: true,
      advancedDiagrams: true,
      exportMarkdown: true,
      exportPDF: true,
      exportHTML: true,
      autoChangeDetection: true,
      customThemes: true,
      whiteLabel: true,
      apiAccess: true,
    }
  }
};

export function getTierLimits(tier: string | null | undefined): TierLimits {
  const t = (tier?.toLowerCase() || 'free') as SubscriptionTier;
  return TIER_LIMITS[t] || TIER_LIMITS.free;
}

export function canCreateProject(currentCount: number, tier: string): boolean {
  const limits = getTierLimits(tier);
  return currentCount < limits.projects;
}

export function hasFeature(tier: string, feature: keyof TierLimits['features']): boolean {
  const limits = getTierLimits(tier);
  return !!limits.features[feature];
}
