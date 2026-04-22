import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import { transactionService, type TransactionFilter } from '../services/transactionService';
import type { Transaction } from '../pages/Dashboard';
import { getTzOffset, getLocalDate } from '../../lib/utils';

export function useTransactions(userId: string | null, filterType: string, startDate: string, endDate: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTransactions = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const tzOffset = getTzOffset();
      const filters: TransactionFilter = {};

      if (filterType === 'today') {
        const date = getLocalDate();
        filters.start = `${date}T00:00:00.000${tzOffset}`;
        filters.end = `${date}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'last7') {
        filters.start = `${getLocalDate(7)}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'last30') {
        filters.start = `${getLocalDate(30)}T00:00:00.000${tzOffset}`;
      } else if (filterType === 'specific' && startDate) {
        filters.start = `${startDate}T00:00:00.000${tzOffset}`;
        filters.end = `${startDate}T23:59:59.999${tzOffset}`;
      } else if (filterType === 'range' && startDate && endDate) {
        filters.start = `${startDate}T00:00:00.000${tzOffset}`;
        filters.end = `${endDate}T23:59:59.999${tzOffset}`;
      }

      if (filterType === 'all') {
        filters.limit = 10;
      }

      const data = await transactionService.fetchTransactions(userId, filters);
      setTransactions(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to load transactions: ' + message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, filterType, startDate, endDate]);

  const removeTransaction = useCallback(async (transaction: Transaction) => {
    if (!userId) return;
    
    try {
      await transactionService.deleteTransaction(transaction, userId);
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      toast.success('Transaction deleted');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Delete failed: ' + message);
      return false;
    }
  }, [userId]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    isLoading,
    refresh: loadTransactions,
    removeTransaction
  };
}