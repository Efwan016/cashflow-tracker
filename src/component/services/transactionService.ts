import { supabase } from '../../lib/supabase';
import type { Transaction }  from '../pages/Dashboard'; //  Correct path relative to src/services/

export interface TransactionFilter {
  start?: string;
  end?: string;
  limit?: number;
}

export const transactionService = {
  async fetchTransactions(userId: string, filters: TransactionFilter): Promise<Transaction[]> {
    let query = supabase
      .from('Transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.start) query = query.gte('created_at', filters.start);
    if (filters.end) query = query.lte('created_at', filters.end);
    if (filters.limit) query = query.limit(filters.limit);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTransaction(transaction: Partial<Transaction>, userId: string) {
    // 1. Cek Stock jika menggunakan produk katalog
    if (transaction.product_id) {
      const { data: stock } = await supabase
        .from('Stock')
        .select('total')
        .eq('product_id', transaction.product_id)
        .eq('user_id', userId)
        .single();

      if (!stock || stock.total < (transaction.qty || 0)) {
        throw new Error('Stok tidak mencukupi untuk transaksi ini');
      }
    }

    // 2. Simpan Transaksi
    const { error: txError } = await supabase.from('Transactions').insert([transaction]);
    if (txError) throw txError;

    // 3. Update Stock & Log jika perlu
    if (transaction.product_id) {
      await supabase.rpc('update_stock', {
        p_product_id: transaction.product_id,
        p_qty: -(transaction.qty || 0),
        p_user_id: userId
      });
    }
  },

  async deleteTransaction(tx: Transaction, userId: string) {
    // 1. Hapus Transaksi
    const { error } = await supabase
      .from('Transactions')
      .delete()
      .eq('id', tx.id)
      .eq('user_id', userId);
    if (error) throw error;

    // 2. Revert Stock jika transaksi terkait produk
    if (tx.product_id) {
      await supabase.rpc('update_stock', {
        p_product_id: tx.product_id,
        p_qty: tx.qty,
        p_user_id: userId
      });
      
      // Log Revert (Optional)
      await supabase.from('Stock_logs').insert([
        { user_id: userId, product_id: tx.product_id, type: 'IN', qty: tx.qty, created_at: new Date().toISOString() }
      ]);
    }
  }
};