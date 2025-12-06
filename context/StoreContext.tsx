
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  Dish, RestaurantProfile, Category, TableSession, CartItem,
  DEFAULT_PROFILE, INITIAL_DISHES, INITIAL_CATEGORIES 
} from '../types';

interface StoreContextType {
  profile: RestaurantProfile;
  updateProfile: (profile: RestaurantProfile) => void;
  
  categories: Category[];
  updateCategory: (category: Category) => void;
  reorderCategories: (newOrder: Category[]) => void;
  addCategory: (label: string) => void;
  deleteCategory: (id: string) => void;

  dishes: Dish[];
  addDish: (dish: Dish) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  duplicateDish: (dish: Dish) => void;
  reorderDishes: (newDishes: Dish[]) => void;
  
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
  
  // Store the state of each table (simulating backend)
  const [tableSessions, setTableSessions] = useState<Record<number, TableSession>>({});

  const updateProfile = (newProfile: RestaurantProfile) => {
    setProfile(newProfile);
  };

  // Category Actions
  const updateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
  };

  const reorderCategories = (newOrder: Category[]) => {
    setCategories(newOrder);
  };

  const addCategory = (label: string) => {
    const newCat: Category = {
      id: `cat_${Date.now()}`,
      label,
      order: categories.length,
      isVisible: true
    };
    setCategories(prev => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    setDishes(prev => prev.filter(d => d.categoryId !== id));
  };

  // Dish Actions
  const addDish = (newDish: Dish) => {
    setDishes(prev => [...prev, newDish]);
  };

  const updateDish = (updatedDish: Dish) => {
    setDishes(prev => prev.map(d => d.id === updatedDish.id ? updatedDish : d));
  };

  const deleteDish = (id: string) => {
    setDishes(prev => prev.filter(d => d.id !== id));
  };

  const duplicateDish = (dishToCopy: Dish) => {
    const newDish: Dish = {
      ...dishToCopy,
      id: `dish_${Date.now()}`,
      name: `${dishToCopy.name} (Copie)`
    };
    setDishes(prev => [...prev, newDish]);
  };

  const reorderDishes = (newDishes: Dish[]) => {
    setDishes(prev => {
      const otherDishes = prev.filter(d => !newDishes.find(nd => nd.id === d.id));
      return [...otherDishes, ...newDishes];
    });
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
