import { useState, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import type { Product } from '../pages/Dashboard';
import { transactionService } from '../services/transactionService';
import { formatDateTimeLocal } from '../../lib/utils';

export function useTransactionForm(userId: string | null, products: Product[], onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    productId: '',
    manualName: '',
    qty: '1',
    salePrice: '0',
    modalPrice: '0'
  });

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);

  const derived = useMemo(() => {
    const qty = Number(form.qty) || 0;
    const sale = Number(form.salePrice) || 0;
    const modal = Number(form.modalPrice) || 0;
    return {
      total: qty * sale,
      profit: (sale - modal) * qty
    };
  }, [form.qty, form.salePrice, form.modalPrice]);

  const handleSelectProduct = useCallback((id: string) => {
    const product = productMap.get(id);
    setForm(prev => ({
      ...prev,
      productId: id,
      salePrice: product ? String(product.harga_jual) : '0',
      modalPrice: product ? String(product.harga_modal) : '0',
      manualName: ''
    }));
  }, [productMap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const qtyNum = Number(form.qty);
    if (qtyNum <= 0) return toast.error('Quantity must be greater than 0');
    if (!form.productId && !form.manualName.trim()) return toast.error('Product name is required');

    setIsSubmitting(true);
    try {
      const product = productMap.get(form.productId);
      await transactionService.createTransaction({
        user_id: userId,
        product_id: form.productId || null,
        product_name: product ? product.name : form.manualName,
        qty: qtyNum,
        harga_jual: Number(form.salePrice),
        harga_modal: Number(form.modalPrice),
        total: derived.total,
        profit: derived.profit,
        mode: form.productId ? 'WITH_STOCK' : 'MANUAL',
        created_at: formatDateTimeLocal()
      }, userId);

      toast.success('Transaction saved!');
      setForm({ productId: '', manualName: '', qty: '1', salePrice: '0', modalPrice: '0' });
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    setForm,
    handleSelectProduct,
    handleSubmit,
    isSubmitting,
    ...derived
  };
}