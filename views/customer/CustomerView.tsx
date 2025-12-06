import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Dish, CartItem, Category, RestaurantProfile } from '../../types';
import { getPublicMenu, PublicMenuResponse } from '../../services/menuService';
import { 
  Utensils, MapPin, Clock, ShoppingBag, Plus, Minus, X, 
  ChevronRight, ChevronDown, CheckCircle, Lock, ArrowLeft, 
  EyeOff, Star, ChefHat, Leaf, Phone, Loader2, AlertTriangle
} from 'lucide-react';

type Step = 'LANDING' | 'MENU' | 'PAYMENT' | 'SUCCESS';

interface CustomerViewProps {
  slug?: string;
  tableId?: number;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  slug = 'demo-1',
  tableId: initialTableId,
}) => {
  // On ne garde du store que la caisse/suivi de table
  const { addItemsToTable, processPayment } = useStore();

  // Data State (vient du backend)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<RestaurantProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [tableInfo, setTableInfo] = useState<{id: number, number: number} | null>(null);

  // Journey state
  const [step, setStep] = useState<Step>('MENU');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Payment state
  const [paymentMode, setPaymentMode] = useState<'SELF' | 'TABLE'>('SELF');
  const [selectedForPayment, setSelectedForPayment] = useState<string[]>([]);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);

  // Filters & groups
  const [subCatFilters, setSubCatFilters] = useState<Record<string, string>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const stickyNavRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // -------- FETCH BACKEND --------
  useEffect(() => {
    setLoading(true);
    setError(null);

    getPublicMenu(slug, initialTableId)
      .then((data: PublicMenuResponse) => {
        const adaptedProfile: RestaurantProfile = {
          name: data.restaurant.name,
          address: data.restaurant.address || '',
          city: data.restaurant.city || '',
          phoneNumber: data.restaurant.phone_number || '',
          tagline: data.restaurant.tagline || '',
          footerText: data.restaurant.footer_text || '',
          openingHours: data.restaurant.opening_hours || '',
          logoUrl: data.restaurant.logo_url || '',
          coverUrl: data.restaurant.cover_url || '',
          themeColor: data.restaurant.theme_color || '#e11d48',
          isOnline: data.restaurant.is_online,
          slug: data.restaurant.slug || slug,
        };

        const adaptedCategories: Category[] = data.categories.map(c => ({
          id: c.id.toString(),
          label: c.label,
          order: c.display_order,
          isVisible: c.is_visible,
        }));

        const adaptedDishes: Dish[] = data.dishes.map(d => ({
          id: d.id.toString(),
          name: d.name,
          description: d.description || '',
          price: d.price_cents / 100,
          categoryId: d.category_id.toString(),
          subCategory: d.sub_category || undefined,
          imageUrl: d.image_url || undefined,
          isAvailable: d.is_available,
          tags: d.tags || [],
        }));

        setProfile(adaptedProfile);
        setCategories(adaptedCategories);
        setDishes(adaptedDishes);

        if (data.table) {
          setTableInfo({ id: data.table.id, number: data.table.number });
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Impossible de charger le menu. Veuillez réessayer.");
        setLoading(false);
      });
  }, [slug, initialTableId]);

  // -------- COMPUTED --------
  const visibleCategories = categories; // déjà filtrées côté API
  const themeStyle = profile ? { '--primary': profile.themeColor } as React.CSSProperties : {};

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const paymentTotal = useMemo(() => {
    let subtotal = 0;
    if (paymentMode === 'TABLE') {
      subtotal = cartTotal;
    } else {
      subtotal = cart.reduce((sum, item) =>
        selectedForPayment.includes(item.cartId)
          ? sum + item.price * item.quantity
          : sum,
      0);
    }
    return subtotal + tipAmount;
  }, [cart, paymentMode, selectedForPayment, tipAmount, cartTotal]);

  // -------- ACTIONS --------

  const addToCart = (dish: Dish) => {
    const newItem: CartItem = {
      ...dish,
      quantity: 1,
      cartId: Math.random().toString(36).slice(2, 11),
    };
    setCart(prev => [...prev, newItem]);
    if (paymentMode === 'SELF') {
      setSelectedForPayment(prev => [...prev, newItem.cartId]);
    }
    setAddedAnimation(dish.id);
    setTimeout(() => setAddedAnimation(null), 1000);
  };

  const removeFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
    setSelectedForPayment(prev => prev.filter(id => id !== cartId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedForPayment([]);
    setIsCartOpen(false);
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.cartId === cartId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handlePay = () => {
    if (!profile) return;
    const tableNumber = tableInfo?.number ?? initialTableId ?? 0;

    setIsProcessing(true);
    setTimeout(() => {
      const itemsToPay =
        paymentMode === 'TABLE'
          ? cart
          : cart.filter(i => selectedForPayment.includes(i.cartId));

      addItemsToTable(tableNumber, itemsToPay);
      processPayment(tableNumber, paymentTotal);

      if (paymentMode === 'TABLE') {
        setCart([]);
      } else {
        setCart(prev =>
          prev.filter(i => !selectedForPayment.includes(i.cartId))
        );
      }
      setIsProcessing(false);
      setStep('SUCCESS');
    }, 1500);
  };

  const toggleSubCatFilter = (catId: string, filter: string) => {
    setSubCatFilters(prev => ({
      ...prev,
      [catId]: prev[catId] === filter ? 'ALL' : filter,
    }));
  };

  const toggleSectionCollapse = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // -------- LOADING / ERROR --------

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <Loader2 size={40} className="animate-spin text-rose-500 mb-4" />
        <p className="font-medium text-slate-600">Chargement du menu...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Une erreur est survenue</h2>
        <p className="text-slate-500 mb-6">
          {error || 'Restaurant introuvable.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // -------- RESTAURANT FERMÉ --------
  if (!profile.isOnline) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-900 text-white">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <EyeOff size={40} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">{profile.name}</h1>
        <div className="w-16 h-1 bg-rose-500 rounded-full mx-auto mb-6"></div>
        <h2 className="text-xl font-bold mb-2">Le restaurant est actuellement fermé.</h2>
        <p className="text-slate-400 mb-8">
          Nous serons heureux de vous accueillir prochainement.
        </p>
        <div className="bg-slate-800 px-6 py-3 rounded-lg text-sm">
          <Clock size={16} className="inline mr-2 -mt-0.5" />
          {profile.openingHours}
        </div>
      </div>
    );
  }

  // -------- UI COMPOSANTS --------

  const HeroSection = () => (
    <div className="relative bg-white pb-8">
      <div className="h-52 w-full relative overflow-hidden bg-slate-200">
        <img src={profile.coverUrl} className="w-full h-full object-cover" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="px-4 relative -mt-12 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden mb-3">
          <img src={profile.logoUrl} className="w-full h-full object-cover" alt="Logo" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{profile.name}</h1>
        <p className="text-base text-slate-500 italic mt-2 max-w-xs mx-auto">
          {profile.tagline}
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs font-medium">
          <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
            <MapPin size={14} /> {profile.city}
          </span>
          {profile.phoneNumber && (
            <a
              href={`tel:${profile.phoneNumber}`}
              className="flex items-center gap-1 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full hover:bg-slate-200"
            >
              <Phone size={14} /> {profile.phoneNumber}
            </a>
          )}
          <span
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full border ${
              profile.isOnline
                ? 'text-green-700 bg-green-50 border-green-200'
                : 'text-slate-600 bg-slate-100 border-slate-200'
            }`}
          >
            <Clock size={14} /> {profile.isOnline ? 'Ouvert' : 'Fermé'} • {profile.openingHours}
          </span>
        </div>
        {tableInfo && (
          <div className="mt-4 bg-rose-50 text-rose-700 px-4 py-1 rounded-full text-xs font-bold border border-rose-100">
            Table {tableInfo.number}
          </div>
        )}
      </div>
    </div>
  );

  const DishCard: React.FC<{ dish: Dish }> = ({ dish }) => {
    const isAdded = addedAnimation === dish.id;

    return (
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 transition-all active:scale-[0.99]">
        <div className="w-24 h-24 bg-slate-100 rounded-lg shrink-0 overflow-hidden relative self-start">
          {dish.imageUrl ? (
            <img src={dish.imageUrl} className="w-full h-full object-cover" alt={dish.name} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Utensils size={24} />
            </div>
          )}
          {dish.tags?.includes("Chef's Choice") && (
            <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm flex items-center gap-1">
              <Star size={8} fill="currentColor" /> Chef
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-base leading-tight mb-1.5">
              {dish.name}
            </h4>
            {dish.tags && dish.tags.length > 0 && (
              <div className="flex gap-1 overflow-x-auto no-scrollbar mb-2 opacity-90">
                {dish.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
              {dish.description}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3">
            <span
              className="font-extrabold text-lg"
              style={{ color: profile.themeColor }}
            >
              {dish.price.toFixed(2).replace('.', ',')} €
            </span>
            <button
              onClick={() => dish.isAvailable && addToCart(dish)}
              disabled={!dish.isAvailable}
              className={`h-9 px-4 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm ${
                isAdded
                  ? 'bg-green-500 text-white scale-105'
                  : dish.isAvailable
                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isAdded ? (
                <>
                  <CheckCircle size={16} /> Ajouté
                </>
              ) : (
                <>
                  <Plus size={16} /> {dish.isAvailable ? 'Ajouter' : 'Épuisé'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CartDrawer = () => {
    if (!isCartOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />
        <div className="relative bg-white w-full max-w-lg rounded-t-2xl shadow-2xl p-4 animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Votre sélection</h3>
            <button
              onClick={clearCart}
              className="text-xs font-medium text-rose-500 hover:text-rose-700"
            >
              Vider la sélection
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
            {cart.map(item => (
              <div
                key={item.cartId}
                className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.price.toFixed(2)} €
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg px-2 py-1 shadow-sm border border-slate-200">
                  <button
                    onClick={() =>
                      item.quantity > 1
                        ? updateQuantity(item.cartId, -1)
                        : removeFromCart(item.cartId)
                    }
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.cartId, 1)}
                    className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setIsCartOpen(false);
              setStep('PAYMENT');
            }}
            style={{ backgroundColor: profile.themeColor }}
            className="w-full text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            <span>Commander</span>
            <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
              {cartTotal.toFixed(2).replace('.', ',')} €
            </span>
          </button>
        </div>
      </div>
    );
  };

  // -------- ÉCRAN MENU --------

  const MenuScreen = () => {
    const [activeCat, setActiveCat] = useState(visibleCategories[0]?.id);

    const scrollToCat = (id: string) => {
      setActiveCat(id);
      setTimeout(() => {
        if (stickyNavRef.current) {
          const offset = stickyNavRef.current.offsetTop;
          window.scrollTo({ top: offset, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      }, 50);
    };

    const currentCat = visibleCategories.find(c => c.id === activeCat);
    const catDishes = dishes.filter(d => d.categoryId === activeCat);

    return (
      <div className="min-h-screen bg-slate-50 pb-40" style={themeStyle}>
        <HeroSection />

        <div
          ref={stickyNavRef}
          className="sticky top-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 py-3 px-4 transition-all duration-200"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {visibleCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => scrollToCat(cat.id)}
                style={
                  activeCat === cat.id
                    ? {
                        backgroundColor: profile.themeColor,
                        borderColor: profile.themeColor,
                        color: 'white',
                      }
                    : {}
                }
                className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCat === cat.id
                    ? 'shadow-md scale-105'
                    : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={menuContainerRef} className="p-4 space-y-10 mt-2 min-h-screen">
          {currentCat && (
            <div
              key={currentCat.id}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {(() => {
                const groupedDishes = catDishes.reduce((acc, dish) => {
                  const key = dish.subCategory || 'Général';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(dish);
                  return acc;
                }, {} as Record<string, Dish[]>);

                const allSubCats = Object.keys(groupedDishes).sort((a, b) => {
                  if (a === 'Général') return -1;
                  if (b === 'Général') return 1;
                  return a.localeCompare(b);
                });

                const activeFilter = subCatFilters[currentCat.id] || 'ALL';
                const visibleGroups =
                  activeFilter === 'ALL'
                    ? allSubCats
                    : allSubCats.filter(g => g === activeFilter);
                const showFilters = allSubCats.length > 1;

                return (
                  <>
                    <div className="flex items-center gap-3 mb-4 pt-2">
                      <h3 className="font-bold text-xl text-slate-800">
                        {currentCat.label}
                      </h3>
                      <div className="h-px bg-slate-200 flex-1" />
                    </div>

                    {showFilters && (
                      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
                        <button
                          onClick={() => toggleSubCatFilter(currentCat.id, 'ALL')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors ${
                            activeFilter === 'ALL'
                              ? 'bg-slate-800 text-white border-slate-800'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Tout
                        </button>
                        {allSubCats.map(sub => (
                          <button
                            key={sub}
                            onClick={() => toggleSubCatFilter(currentCat.id, sub)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-colors ${
                              activeFilter === sub
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    )}

                    {visibleGroups.length === 0 && (
                      <div className="text-center py-10 text-slate-400">
                        <p>Aucun plat disponible dans cette catégorie.</p>
                      </div>
                    )}

                    {visibleGroups.map(groupName => {
                      const sectionKey = `${currentCat.id}-${groupName}`;
                      const isCollapsed = collapsedSections[sectionKey];
                      const canCollapse = showFilters && activeFilter === 'ALL';

                      return (
                        <div
                          key={groupName}
                          className="mb-6 last:mb-0 transition-all"
                        >
                          {showFilters && activeFilter === 'ALL' && (
                            <button
                              onClick={() => toggleSectionCollapse(sectionKey)}
                              className="w-full font-bold text-slate-600 text-sm uppercase tracking-wider mb-3 pl-1 flex items-center justify-between gap-2 group hover:text-slate-900 transition-colors"
                            >
                              <span className="flex items-center gap-2 flex-1">
                                {groupName}
                                <div className="h-px bg-slate-100 flex-1 group-hover:bg-slate-200" />
                              </span>
                              <ChevronDown
                                size={16}
                                className={`transition-transform duration-300 ${
                                  isCollapsed ? '' : 'rotate-180'
                                }`}
                              />
                            </button>
                          )}
                          <div
                            className={`grid gap-4 sm:grid-cols-2 transition-all duration-300 ease-in-out ${
                              isCollapsed && canCollapse
                                ? 'max-h-0 opacity-0 overflow-hidden'
                                : 'max-h-[1000px] opacity-100'
                            }`}
                          >
                            {groupedDishes[groupName].map(dish => (
                              <DishCard key={dish.id} dish={dish} />
                            ))}
                          </div>
                          {isCollapsed && canCollapse && (
                            <div className="text-center text-xs text-slate-400 italic mt-1 mb-4">
                              Section masquée
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="text-center py-8 opacity-60 px-6">
          <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center text-slate-400">
            <ChefHat size={24} />
          </div>
          <p className="text-sm font-medium text-slate-500">Cuisine authentique</p>
          <p className="text-xs text-slate-400">
            Préparé avec passion à {profile.city}
          </p>
          {profile.footerText && (
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto whitespace-pre-line leading-relaxed">
              {profile.footerText}
            </p>
          )}
          {profile.phoneNumber && (
            <a
              href={`tel:${profile.phoneNumber}`}
              className="text-xs text-slate-500 mt-2 block hover:underline"
            >
              {profile.phoneNumber}
            </a>
          )}
        </div>

        {cart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between hover:scale-[1.01] transition-transform active:scale-[0.99] border border-slate-800"
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: profile.themeColor }}
                  className="text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                >
                  {cartCount}
                </div>
                <div className="text-left">
                  <div className="font-bold text-sm">Votre sélection</div>
                  <div className="text-xs text-slate-400">Voir le détail</div>
                </div>
              </div>
              <div className="font-bold text-lg flex items-center gap-2">
                <span>{cartTotal.toFixed(2).replace('.', ',')} €</span>
                <ChevronRight size={18} className="text-slate-500" />
              </div>
            </button>
          </div>
        )}
        <CartDrawer />
      </div>
    );
  };

  // -------- ÉCRAN PAIEMENT --------

  const PaymentScreen = () => (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={themeStyle}>
      <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => setStep('MENU')}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-bold text-lg">Règlement</h2>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex text-sm font-medium">
          <button
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              paymentMode === 'SELF'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setPaymentMode('SELF')}
          >
            Je paie ma part
          </button>
          <button
            className={`flex-1 py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 ${
              paymentMode === 'TABLE'
                ? 'bg-slate-900 text-white shadow'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
            onClick={() => setPaymentMode('TABLE')}
          >
            Je paie tout
          </button>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShoppingBag size={16} className="text-rose-500" />
            {paymentMode === 'TABLE'
              ? 'Totalité de la table'
              : 'Articles sélectionnés'}
          </h3>
          <div className="space-y-3 mb-4">
            {cart.map(item => {
              const isSelected =
                paymentMode === 'TABLE' ||
                selectedForPayment.includes(item.cartId);

              return (
                <div
                  key={item.cartId}
                  onClick={() => {
                    if (paymentMode === 'SELF') {
                      if (isSelected) {
                        setSelectedForPayment(prev =>
                          prev.filter(id => id !== item.cartId)
                        );
                      } else {
                        setSelectedForPayment(prev => [...prev, item.cartId]);
                      }
                    }
                  }}
                  className={`flex justify-between items-center text-sm p-2 rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-slate-50' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {paymentMode === 'SELF' && (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle size={10} className="text-white" />
                        )}
                      </div>
                    )}
                    <span
                      className={
                        isSelected
                          ? 'text-slate-900 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      {item.quantity}x {item.name}
                    </span>
                  </div>
                  <span className="font-bold">
                    €{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between font-bold pt-3 border-t border-slate-100 text-lg">
            <span>À payer</span>
            <span style={{ color: profile?.themeColor }}>
              €{(paymentTotal - tipAmount).toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            Pourboire pour l'équipe
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 5].map(amount => (
              <button
                key={amount}
                onClick={() => setTipAmount(amount)}
                className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                  tipAmount === amount
                    ? 'text-white shadow-md scale-105'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
                style={
                  tipAmount === amount
                    ? {
                        backgroundColor: profile?.themeColor,
                        borderColor: profile?.themeColor,
                      }
                    : {}
                }
              >
                {amount === 0 ? 'Non' : `+ ${amount}€`}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-slate-200 pb-8 safe-area-bottom">
        <button
          onClick={handlePay}
          disabled={isProcessing || paymentTotal <= 0}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Lock size={18} />
              <span>Régler {paymentTotal.toFixed(2).replace('.', ',')} €</span>
            </>
          )}
        </button>
        <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
          <Lock size={10} /> Paiement chiffré et sécurisé
        </div>
      </div>
    </div>
  );

  // -------- ÉCRAN SUCCESS --------

  const SuccessScreen = () => (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 text-green-600 shadow-lg shadow-green-200/50">
        <CheckCircle size={48} />
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-2">
        Paiement validé !
      </h2>
      <div className="w-16 h-1 bg-green-500 rounded-full mb-6 mx-auto opacity-50" />
      <p className="text-slate-600 mb-10 text-lg leading-relaxed max-w-xs mx-auto">
        Merci de votre visite.
        <br />
        Votre reçu a été envoyé par email.
      </p>

      <button
        onClick={() => {
          setStep('MENU');
          setCart([]);
          setTipAmount(0);
        }}
        className="w-full max-w-xs bg-white text-slate-900 border-2 border-slate-100 font-bold py-4 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
      >
        Retour à la carte
      </button>

      <p className="mt-12 text-sm font-medium text-green-800 flex items-center gap-2">
        <Leaf size={14} /> À bientôt à {profile?.name}
      </p>
    </div>
  );

  // -------- ROUTAGE INTERNE --------

  switch (step) {
    case 'LANDING':
      return <MenuScreen />;
    case 'MENU':
      return <MenuScreen />;
    case 'PAYMENT':
      return <PaymentScreen />;
    case 'SUCCESS':
      return <SuccessScreen />;
    default:
      return <MenuScreen />;
  }
};