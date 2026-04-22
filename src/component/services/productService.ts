import { supabase } from '../../lib/supabase';
import type { Product } from '../pages/Dashboard'; // Correct path relative to src/services/

export const productService = {
  async getProducts(userId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }
};