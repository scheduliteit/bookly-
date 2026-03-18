
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

export const paymentService = {
  getMerchantStats: async (): Promise<MerchantStats> => {
    const res = await fetch('/api/payments/stats');
    return res.json();
  },

  async connectLocalGateway(): Promise<boolean> {
    const res = await fetch('/api/payments/connect', { method: 'POST' });
    return res.ok;
  },

  async processIncomingPayment(amount: number, description: string): Promise<void> {
    await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description })
    });
  },

  async triggerPayout(): Promise<boolean> {
    const res = await fetch('/api/payments/payout', { method: 'POST' });
    return res.ok;
  },

  async createCheckoutSession(data: { serviceName: string, amount: number, currency: string, successUrl: string, cancelUrl: string, appointmentId: string }): Promise<{ url: string }> {
    const res = await fetch('/api/payments/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }
    return res.json();
  }
};
