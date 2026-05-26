import { supabase } from '../../lib/supabase';
import type { Transaction, TransactionFilter } from '../../types/types';

type SmartCashierAlertRecord = {
  user_id: string;
  total: number;
  product_name: string;
  harga_modal: number;
  harga_jual: number;
};

const warnSmartCashierAlert = async (record: SmartCashierAlertRecord) => {
  try {
    const { error } = await supabase.functions.invoke('smart-cashier-alert', {
      body: { record }
    });

    if (error) {
      console.warn('Smart cashier alert failed:', error.message);
    }
  } catch (error) {
    console.warn('Smart cashier alert failed:', error);
  }
};

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
    const { error: txError } = await supabase
      .from('Transactions')
      .insert([{ ...transaction, user_id: userId }])
    if (txError) throw txError;

    // 3. Update Stock & Log jika perlu
    if (transaction.product_id) {
      const { error: stockError } = await supabase.rpc('update_stock', {
        p_product_id: transaction.product_id,
        p_qty: -(transaction.qty || 0),
        p_user_id: userId
      });

      if (stockError) throw stockError;

      const { data: updatedStock, error: updatedStockError } = await supabase
        .from('Stock')
        .select('total')
        .eq('product_id', transaction.product_id)
        .eq('user_id', userId)
        .single();

      if (updatedStockError) {
        console.warn('Failed to read updated stock for smart cashier alert:', updatedStockError.message);
        return;
      }

      const updatedStockTotal = Number(updatedStock?.total);

      if (Number.isFinite(updatedStockTotal) && updatedStockTotal <= 2) {
        await warnSmartCashierAlert({
          user_id: userId,
          total: updatedStockTotal,
          product_name: transaction.product_name || 'Produk tanpa nama',
          harga_modal: transaction.harga_modal ?? 0,
          harga_jual: transaction.harga_jual ?? 0
        });
      }
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
