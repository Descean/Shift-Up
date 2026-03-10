// ============================================================
// SHIFT UP — Types globaux
// ============================================================

// ----- UTILISATEURS -----
export type UserRole = "CLIENT" | "APPORTEUR" | "ETUDIANT" | "ADMIN" | "DEVELOPER";

export type UserPlan = "GRATUIT" | "STARTER" | "PRO" | "ENTERPRISE";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  avatar?: string;
  phone?: string;
  affiliationCode: string;
  stars: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientProfile extends User {
  role: "CLIENT";
  affiliatedBy?: string;
  totalSpent: number;
  servicesCount: number;
}

export interface ApporteurProfile extends User {
  role: "APPORTEUR";
  ifu: string;
  level: "BRONZE" | "ARGENT" | "OR" | "PLATINE" | "DIAMANT";
  totalEarnings: number;
  referralsCount: number;
  quarterlyRank?: number;
}

export interface EtudiantProfile extends User {
  role: "ETUDIANT";
  studentCard?: string;
  university?: string;
  completedTasks: number;
  badges: string[];
}

// ----- SERVICES -----
export type ServiceDomain =
  | "CONSEIL_STRATEGIQUE"
  | "SOLUTIONS_NUMERIQUES"
  | "FORMATION"
  | "MARKETING"
  | "JURIDIQUE"
  | "FINANCE";

export interface Service {
  id: string;
  domain: ServiceDomain;
  title: string;
  description: string;
  features: string[];
  priceMin: number;
  priceMax: number | null;
  currency: "XOF" | "EUR" | "USD";
  duration?: string;
  isPopular?: boolean;
  isNew?: boolean;
}

// ----- PRESTATIONS -----
export type PrestationStatus =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "LIVRAISON"
  | "REVISION"
  | "TERMINEE"
  | "ANNULEE";

export interface PrestationPhase {
  id: string;
  title: string;
  description: string;
  progress: number;
  completedAt?: Date;
  steps: PrestationStep[];
}

export interface PrestationStep {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  completedAt?: Date;
}

export interface Prestation {
  id: string;
  clientId: string;
  serviceId: string;
  service: Service;
  status: PrestationStatus;
  phases: PrestationPhase[];
  currentPhase: number;
  globalProgress: number;
  assignedTo?: string;
  amount: number;
  amountPaid: number;
  startDate: Date;
  estimatedEndDate?: Date;
  endDate?: Date;
  notes?: string;
  rating?: number;
  review?: string;
}

// ----- PAIEMENTS -----
export type PaymentMethod = "MOBILE_MONEY" | "CARD" | "BANK_TRANSFER";
export type PaymentProvider = "FEDAPAY" | "STRIPE";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  prestationId: string;
  amount: number;
  currency: "XOF" | "EUR" | "USD";
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  reference: string;
  invoiceUrl?: string;
  createdAt: Date;
}

// ----- AFFILIATION -----
export interface AffiliationStats {
  code: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  lastPaidDate?: Date;
  history: AffiliationEntry[];
}

export interface AffiliationEntry {
  id: string;
  referredUser: string;
  serviceAmount: number;
  commission: number;
  date: Date;
  isPaid: boolean;
}

// ----- BLOG -----
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar?: string;
  category: string;
  tags: string[];
  coverImage?: string;
  publishedAt: Date;
  readTime: number;
  views: number;
}

// ----- CHATBOT -----
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  visitorId?: string;
  page?: string;
  converted?: boolean;
  startedAt: Date;
}

// ----- FAQ -----
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
}

// ----- TESTIMONIALS -----
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  content: string;
  rating: number;
  service: string;
  date: Date;
}

// ----- API RESPONSES -----
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ----- NEWSLETTER -----
export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: Date;
  isActive: boolean;
}

// ----- MICRO-TASKS (Etudiant) -----
export type MicroTaskType = "DATA_ENTRY" | "REDACTION" | "RECHERCHE" | "TEST_LOGICIEL" | "AUTRE";
export type MicroTaskStatus = "DISPONIBLE" | "EN_COURS" | "SOUMIS" | "VALIDE" | "REFUSE";

export interface MicroTask {
  id: string;
  title: string;
  description: string;
  type: MicroTaskType;
  reward: number;
  currency: "XOF";
  estimatedHours: number;
  deadline: Date;
  status: MicroTaskStatus;
  assignedTo?: string;
}
