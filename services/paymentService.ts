
import { auth } from "../firebase";

export interface Transaction {
  id: string;
  type: 'subscription' | 'payout' | 'booking';
  amount: number;
  currency: string;
  date: string;
  status: 'succeeded' | 'processing' | 'failed';
  description: string;
  invoiceUrl?: string; // Link to the digital tax receipt
}

export interface MerchantStats {
  grossEarnings: number;
  netEarnings: number;
  pendingPayout: number;
  isGatewayConnected: boolean;
  clearerName?: string;
  history: Transaction[];
}

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const headers = {
    ...options.headers as any,
    ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
    'Content-Type': 'application/json'
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
    const error: any = new Error(errorData.error || `HTTP error! status: ${res.status}`);
    error.details = errorData.details;
    error.hint = errorData.hint;
    error.errorCode = errorData.errorCode;
    error.status = errorData.status;
    throw error;
  }
  return res.json();
};

export const paymentService = {
  getMerchantStats: async (): Promise<MerchantStats> => {
    return fetchWithAuth('/api/payments/stats');
  },

  async connectLocalGateway(): Promise<boolean> {
    try {
      await fetchWithAuth('/api/payments/connect', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  },

  async triggerPayout(): Promise<boolean> {
    try {
      await fetchWithAuth('/api/payments/payout', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  },

  async createCheckoutSession(data: { serviceName: string, amount: number, currency: string, successUrl: string, cancelUrl: string, appointmentId: string }): Promise<{ url: string }> {
    return fetchWithAuth('/api/payments/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async createSubscriptionCheckout(data: { plan: string, billingCycle: 'monthly' | 'annual', userId?: string, email?: string, successUrl: string, cancelUrl: string }): Promise<{ url: string }> {
    return fetchWithAuth('/api/payments/create-subscription-checkout', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
