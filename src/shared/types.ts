export type RoomStatus = 'free' | 'booked' | 'rented';
export type RoomPurpose = 'prod' | 'wh' | 'off';

export interface PropertyObject {
  id: number;
  name: string;
  address: string;
  description: string;
  utilities: string;
  security: string;
  image: string;
  x: number;
  y: number;
  lat: number;
  lng: number;
}

export interface RoomItem {
  id: number;
  objectId: number;
  title: string;
  area: number;
  purpose: RoomPurpose;
  pricePerSqm: number;
  status: RoomStatus;
  features: string[];
  image: string;
  leaseTerms: string;
  featuredOnStart?: boolean;
}

export interface ResidentItem {
  id: number;
  name: string;
  industry: string;
  objectId: number;
  sinceYear: string;
  description: string;
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: 'rent' | 'utilities' | 'owners' | 'terms';
  isPriorityAi: boolean;
}

export interface InfoBlock {
  id: string;
  title: string;
  summary: string;
}

export interface PageTexts {
  homeHeroTitle1: string;
  homeHeroTitle2: string;
  homeHeroTitle3: string;
  homeHeroLead: string;
  homeManifestoLead: string;
  homeManifestoSub: string;
  tenantsIntro: string;
  ownersIntro: string;
  residentsIntro: string;
  aboutStatement: string;
  privacyText: string;
}

export interface ContactInfo {
  companyName: string;
  legalAddress: string;
  inn: string;
  kpp: string;
  ogrn: string;
  phoneDisplay: string;
  phoneHref: string;
  email: string;
  leadRecipientEmail: string;
  workHours: string;
  domain: string;
}

export interface AnalyticsSettings {
  yandexMetrikaId: string;
  webvisor: boolean;
  clickmap: boolean;
  trackLinks: boolean;
  accurateTrackBounce: boolean;
  smartCaptchaSiteKey: string;
}

export interface WordPressSettings {
  siteUrl: string;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  lastSyncMessage: string | null;
}

export interface CmsThemeSettings {
  accentColor?: string;
  showInfraOnHome?: boolean;
  showProcessOnHome?: boolean;
  showFaqOnHome?: boolean;
  showLeadFormOnHome?: boolean;
}

export interface CmsSettings {
  featuredFreeLimit: number; // 5..7 free rooms on start per TZ 4.1
  tenantsTotalCount: string;
  contacts: ContactInfo;
  analytics: AnalyticsSettings;
  wordpress: WordPressSettings;
  theme?: CmsThemeSettings;
}

export interface CmsState {
  objects: PropertyObject[];
  rooms: RoomItem[];
  residents: ResidentItem[];
  faqs: FaqItem[];
  infoBlocks: InfoBlock[];
  pages: PageTexts;
  settings: CmsSettings;
  updatedAt: string;
}

export interface LeadSubmission {
  id: string;
  type: 'tenant' | 'owner';
  name: string;
  phone: string;
  email: string;
  purposeOrObject: string;
  area: string;
  message: string;
  status: 'new' | 'in_progress' | 'done';
  createdAt: string;
  emailDispatched: boolean;
  emailNote: string;
}

export interface AnalyticsEventLog {
  id: string;
  goal: string;
  path: string;
  meta?: string;
  timestamp: string;
}
