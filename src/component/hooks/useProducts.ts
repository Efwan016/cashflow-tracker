import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { productService } from '../services/productService';
import type { Product } from '../pages/Dashboard';

export function useProducts(userId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!userId) {
      setProducts([]);
      return;
    }
    setIsLoadingProducts(true);
    try {
      const data = await productService.getProducts(userId);
      setProducts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Failed to load products: ' + message);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    isLoadingProducts,
    refreshProducts: loadProducts,
  };
}