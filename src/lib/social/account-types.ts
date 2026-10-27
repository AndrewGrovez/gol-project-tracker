export const SOCIAL_ACCOUNT_KEYS = ["gol", "dref-wen"] as const;
export type SocialAccountKey = (typeof SOCIAL_ACCOUNT_KEYS)[number];

export interface SocialAccountSummary {
  key: SocialAccountKey;
  label: string;
  href: string;
  facebookConfigured: boolean;
  instagramConfigured: boolean;
}
