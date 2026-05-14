import { User } from '@supabase/supabase-js';

export interface Customer {
  phone: string;
  name: string;
  points: number;
  last_visit?: string;
  tier?: 'Silver' | 'Gold' | 'Platinum';
}

export interface Reward {
  id: string;
  name: string;
  points_required: number;
  description: string;
  image_url?: string;
  active?: boolean;
}

export interface Transaction {
  id: string;
  created_at: string;
  customer_phone: string;
  coupon_number?: string;
  value: number;
  points_earned: number;
  type: 'earn' | 'redeem';
}

export enum View {
  LANDING,
  CASHIER,
  CUSTOMER,
  ADMIN
}

export const getTier = (points: number): 'Silver' | 'Gold' | 'Platinum' => {
  if (points >= 1501) return 'Platinum';
  if (points >= 501) return 'Gold';
  return 'Silver';
};
