'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { CartItem } from '@apps/shared/types/cart';
import { apiClient } from '@/lib/api-client';
import { useUser } from '@/modules/auth/hooks/use-user';
import { useToast } from '@/hooks/use-toast';

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addItem: (productId: string, qty: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cart_items';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();

  // ── updateQuantity (defined before mergeCarts which depends on it) ──────────
  const updateQuantity = useCallback(
    async (productId: string, qty: number) => {
      setLoading(true);
      try {
        if (user) {
          const { data } = await apiClient.put(`/cart/items/${productId}`, {
            qty,
          });
          setItems(data.items);
        } else {
          setItems(prev =>
            prev.map(item =>
              item.productId === productId ? { ...item, qty } : item,
            ),
          );
        }
      } catch {
        console.error('Error updating cart item');
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // ── addItem ─────────────────────────────────────────────────────────────────
  const addItem = useCallback(
    async (productId: string, qty: number) => {
      setLoading(true);
      try {
        if (user) {
          const { data } = await apiClient.post('/cart/items', {
            productId,
            qty,
          });
          setItems(data.items);
          toast({
            title: 'Item added to cart',
            description: 'Your item has been added to your cart successfully.',
          });
        } else {
          const response = await apiClient.get(`/products/${productId}`);
          const product = response.data;

          setItems(prev => {
            const existingItem = prev.find(
              item => item.productId === productId,
            );
            if (existingItem) {
              return prev.map(item =>
                item.productId === productId ? { ...item, qty } : item,
              );
            }
            const newItem: CartItem = {
              productId: product._id,
              name: product.name,
              image: product.images[0],
              price: product.price,
              countInStock: product.countInStock,
              qty,
            };
            return [...prev, newItem];
          });
          toast({
            title: 'Item added to cart',
            description: 'Your item has been saved to your local cart.',
          });
        }
      } catch {
        toast({
          title: 'Error adding item',
          description: 'There was a problem adding your item to the cart.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    },
    [user, toast],
  );

  // ── mergeCarts ───────────────────────────────────────────────────────────────
  const mergeCarts = useCallback(
    async (localItems: CartItem[], serverItems: CartItem[]) => {
      const serverItemsMap = new Map(
        serverItems.map(item => [item.productId, item]),
      );

      for (const localItem of localItems) {
        const serverItem = serverItemsMap.get(localItem.productId);
        if (serverItem) {
          await updateQuantity(
            localItem.productId,
            Math.max(localItem.qty, serverItem.qty),
          );
        } else {
          await addItem(localItem.productId, localItem.qty);
        }
      }
    },
    [updateQuantity, addItem],
  );

  // ── Load cart on mount / user change ────────────────────────────────────────
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      try {
        if (user) {
          const localCart = localStorage.getItem(CART_STORAGE_KEY);
          const localItems = localCart ? JSON.parse(localCart) : [];

          const { data } = await apiClient.get('/cart');

          if (localItems.length > 0) {
            toast({
              title: 'Syncing your cart...',
              description: "We're adding your saved items to your account.",
            });
            await mergeCarts(localItems, data.items);
            toast({
              title: 'Cart synced!',
              description: 'Your items have been saved to your account.',
            });
            localStorage.removeItem(CART_STORAGE_KEY);
          } else {
            setItems(data.items);
          }
        } else {
          const storedCart = localStorage.getItem(CART_STORAGE_KEY);
          if (storedCart) {
            setItems(JSON.parse(storedCart));
          }
        }
      } catch {
        console.error('Error loading cart');
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, [user, mergeCarts, toast]); // deps now complete — no warning

  // ── Sync guest cart to localStorage ─────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  // ── removeItem ───────────────────────────────────────────────────────────────
  const removeItem = async (productId: string) => {
    setLoading(true);
    try {
      if (user) {
        const { data } = await apiClient.delete(`/cart/items/${productId}`);
        setItems(data.items);
      } else {
        setItems(items.filter(item => item.productId !== productId));
      }
      toast({
        title: 'Item removed',
        description: 'The item has been removed from your cart.',
      });
    } catch {
      toast({
        title: 'Error removing item',
        description: 'There was a problem removing the item from your cart.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── clearCart ────────────────────────────────────────────────────────────────
  const clearCart = async () => {
    setLoading(true);
    try {
      if (user) {
        await apiClient.delete('/cart');
      }
      setItems([]);
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart.',
      });
    } catch {
      toast({
        title: 'Error clearing cart',
        description: 'There was a problem clearing your cart.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
