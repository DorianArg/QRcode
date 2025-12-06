
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  Dish, RestaurantProfile, Category, TableSession, CartItem,
  DEFAULT_PROFILE, INITIAL_DISHES, INITIAL_CATEGORIES
} from '../types';
import {
  createAdminCategory,
  createAdminDish,
  deleteAdminCategory,
  deleteAdminDish,
  getAdminCategories,
  getAdminDishes,
  getAdminRestaurant,
  slugify,
  updateAdminCategory,
  updateAdminDish,
  updateAdminRestaurant
} from '../services/api/adminService';

interface StoreContextType {
  profile: RestaurantProfile;
  updateProfile: (profile: RestaurantProfile) => Promise<void>;
  
  categories: Category[];
  updateCategory: (category: Category) => Promise<void>;
  reorderCategories: (newOrder: Category[]) => Promise<void>;
  addCategory: (label: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  dishes: Dish[];
  addDish: (dish: Dish) => Promise<void>;
  updateDish: (dish: Dish) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  duplicateDish: (dish: Dish) => Promise<void>;
  reorderDishes: (newDishes: Dish[]) => Promise<void>;
  
  tableCount: number;
  setTableCount: (count: number) => void;

  // New: Table Sessions Management
  tableSessions: Record<number, TableSession>;
  addItemsToTable: (tableId: number, items: CartItem[]) => void;
  processPayment: (tableId: number, amount: number) => void;
  resetTable: (tableId: number) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<RestaurantProfile>(DEFAULT_PROFILE);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [dishes, setDishes] = useState<Dish[]>(INITIAL_DISHES);
  const [tableCount, setTableCount] = useState<number>(6);
  const [, setLoadError] = useState<string | null>(null);

  const DEFAULT_SLUG = DEFAULT_PROFILE.slug || 'demo-1';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const restaurant = await getAdminRestaurant(DEFAULT_SLUG);
        const [fetchedCategories, fetchedDishes] = await Promise.all([
          getAdminCategories(restaurant.slug),
          getAdminDishes(restaurant.slug)
        ]);

        setProfile(restaurant);
        setCategories(fetchedCategories.sort((a, b) => a.order - b.order));
        setDishes(
          fetchedDishes.sort(
            (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
          )
        );
      } catch (error) {
        console.error('Failed to load admin data', error);
        setLoadError('Impossible de charger les données.');
      }
    };

    fetchData();
  }, [DEFAULT_SLUG]);
  
  // Store the state of each table (simulating backend)
  const [tableSessions, setTableSessions] = useState<Record<number, TableSession>>({});

  const updateProfile = async (newProfile: RestaurantProfile) => {
    try {
      const updated = await updateAdminRestaurant(profile.slug, newProfile);
      setProfile(updated);
    } catch (error) {
      console.error('Failed to update profile', error);
      throw error;
    }
  };

  // Category Actions
  const updateCategory = async (updatedCat: Category) => {
    try {
      const saved = await updateAdminCategory(Number(updatedCat.id), {
        label: updatedCat.label,
        slug: updatedCat.slug || slugify(updatedCat.label),
        display_order: updatedCat.order,
        is_visible: updatedCat.isVisible
      });
      setCategories(prev => prev.map(c => c.id === updatedCat.id ? saved : c));
    } catch (error) {
      console.error('Failed to update category', error);
      throw error;
    }
  };

  const reorderCategories = async (newOrder: Category[]) => {
    try {
      const updated = await Promise.all(
        newOrder.map((cat, index) =>
          updateAdminCategory(Number(cat.id), {
            label: cat.label,
            slug: cat.slug || slugify(cat.label),
            display_order: index,
            is_visible: cat.isVisible
          })
        )
      );
      setCategories(updated.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to reorder categories', error);
    }
  };

  const addCategory = async (label: string) => {
    if (!profile.slug) return;
    try {
      const created = await createAdminCategory(profile.slug, {
        label,
        slug: slugify(label),
        display_order: categories.length,
        is_visible: true
      });
      setCategories(prev => [...prev, created].sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Failed to add category', error);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteAdminCategory(Number(id));
      setCategories(prev => prev.filter(c => c.id !== id));
      setDishes(prev => prev.filter(d => d.categoryId !== id));
    } catch (error) {
      console.error('Failed to delete category', error);
      throw error;
    }
  };

  // Dish Actions
  const addDish = async (newDish: Dish) => {
    if (!profile.slug) return;
    try {
      const order = dishes.filter(d => d.categoryId === newDish.categoryId).length;
      const created = await createAdminDish(profile.slug, {
        ...newDish,
        displayOrder: order
      });
      setDishes(prev => [...prev, created].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
    } catch (error) {
      console.error('Failed to add dish', error);
      throw error;
    }
  };

  const updateDish = async (updatedDish: Dish) => {
    try {
      const saved = await updateAdminDish(Number(updatedDish.id), updatedDish);
      setDishes(prev => prev.map(d => d.id === updatedDish.id ? saved : d));
    } catch (error) {
      console.error('Failed to update dish', error);
      throw error;
    }
  };

  const deleteDish = async (id: string) => {
    try {
      await deleteAdminDish(Number(id));
      setDishes(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to delete dish', error);
      throw error;
    }
  };

  const duplicateDish = async (dishToCopy: Dish) => {
    const copy: Dish = {
      ...dishToCopy,
      id: '',
      name: `${dishToCopy.name} (Copie)`
    };
    await addDish(copy);
  };

  const reorderDishes = async (newDishes: Dish[]) => {
    try {
      const updated = await Promise.all(
        newDishes.map((dish, index) =>
          updateAdminDish(Number(dish.id), { ...dish, displayOrder: index })
        )
      );

      setDishes(prev => {
        const otherDishes = prev.filter(d => !newDishes.find(nd => nd.id === d.id));
        return [...otherDishes, ...updated].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      });
    } catch (error) {
      console.error('Failed to reorder dishes', error);
    }
  };

  // --- Table & Order Logic ---

  const addItemsToTable = (tableId: number, newItems: CartItem[]) => {
    setTableSessions(prev => {
      const currentSession = prev[tableId] || {
        tableId,
        status: 'FREE',
        items: [],
        totalAmount: 0,
        paidAmount: 0,
        startTime: Date.now()
      };

      const updatedItems = [...currentSession.items, ...newItems];
      const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Status becomes OCCUPIED if it was FREE, or remains PARTIAL if people are eating while others paid
      let newStatus = currentSession.status;
      if (currentSession.status === 'FREE' || currentSession.status === 'PAID') {
        newStatus = 'OCCUPIED';
      } else if (currentSession.status === 'PARTIAL') {
        // If it was partial, it remains partial until fully paid
        newStatus = 'PARTIAL'; 
      }

      return {
        ...prev,
        [tableId]: {
          ...currentSession,
          status: newStatus,
          items: updatedItems,
          totalAmount: newTotal,
        }
      };
    });
  };

  const processPayment = (tableId: number, amountPaid: number) => {
    setTableSessions(prev => {
      const session = prev[tableId];
      if (!session) return prev;

      const newPaidAmount = session.paidAmount + amountPaid;
      // Float precision check
      const isFullyPaid = newPaidAmount >= session.totalAmount - 0.01;

      return {
        ...prev,
        [tableId]: {
          ...session,
          paidAmount: newPaidAmount,
          status: isFullyPaid ? 'PAID' : 'PARTIAL'
        }
      };
    });
  };

  const resetTable = (tableId: number) => {
    setTableSessions(prev => {
      const newState = { ...prev };
      delete newState[tableId];
      return newState;
    });
  };

  return (
    <StoreContext.Provider value={{
      profile,
      updateProfile,
      categories,
      updateCategory,
      reorderCategories,
      addCategory,
      deleteCategory,
      dishes,
      addDish,
      updateDish,
      deleteDish,
      duplicateDish,
      reorderDishes,
      tableCount,
      setTableCount,
      tableSessions,
      addItemsToTable,
      processPayment,
      resetTable
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
