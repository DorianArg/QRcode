import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Dish, Category } from '../../types';
import { DishModal } from '../../components/DishModal';
import { Button } from '../../components/ui/Button';
import { 
  Plus, Edit2, Trash2, Utensils, GripVertical, 
  Copy, Eye, EyeOff, Settings, ChefHat, ChevronDown
} from 'lucide-react';

export const MenuView: React.FC = () => {
  const { 
    dishes, categories, 
    addDish, updateDish, deleteDish, duplicateDish, reorderDishes,
    addCategory, updateCategory, deleteCategory
  } = useStore();

  const [activeTab, setActiveTab] = useState<string>(categories[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | undefined>(undefined);
  const [isManageCatOpen, setIsManageCatOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Drag and Drop state (Using IDs for robustness)
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // Filter dishes by active category
  const activeCategoryDishes = dishes.filter(d => d.categoryId === activeTab);

  // Group dishes by subCategory
  const groupedDishes = activeCategoryDishes.reduce((acc, dish) => {
    const key = dish.subCategory || 'Général';
    if (!acc[key]) acc[key] = [];
    acc[key].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  // Sort groups: General first, then alphabetical
  const sortedGroups = Object.keys(groupedDishes).sort((a, b) => {
    if (a === 'Général') return -1;
    if (b === 'Général') return 1;
    return a.localeCompare(b);
  });

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItem.current = id;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    dragOverItem.current = id;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragItem.current || !dragOverItem.current) return;
    if (dragItem.current === dragOverItem.current) return;
    
    const draggedId = dragItem.current;
    const targetId = dragOverItem.current;

    const currentList = [...activeCategoryDishes];
    const draggedDish = currentList.find(d => d.id === draggedId);
    const targetDish = currentList.find(d => d.id === targetId);

    if (!draggedDish || !targetDish) return;

    // Remove dragged item from its old position
    const newList = currentList.filter(d => d.id !== draggedId);
    
    // Find index of target to insert before
    const targetIndex = newList.findIndex(d => d.id === targetId);
    
    // Update subcategory of dragged item to match target (move between groups)
    const updatedDish = { ...draggedDish, subCategory: targetDish.subCategory };
    
    // Insert
    newList.splice(targetIndex, 0, updatedDish);
    
    void reorderDishes(newList);
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const toggleAvailability = (dish: Dish) => {
    void updateDish({ ...dish, isAvailable: !dish.isAvailable });
  };

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingDish(undefined);
    setIsModalOpen(true);
  };

  const handleSave = async (dish: Dish) => {
    if (editingDish) {
      await updateDish(dish);
    } else {
      await addDish(dish);
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestion du Menu</h2>
          <p className="text-slate-500">Organisez vos plats, catégories et sous-catégories.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsManageCatOpen(!isManageCatOpen)} className="gap-2">
            <Settings size={16} /> Catégories
          </Button>
          <Button onClick={handleAdd} className="gap-2 shadow-sm">
            <Plus size={18} /> Ajouter un plat
          </Button>
        </div>
      </div>

      {/* Category Management Panel (Inline for simplicity) */}
      {isManageCatOpen && (
        <div className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-4 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h3 className="font-bold text-slate-800">Organiser les catégories principales</h3>
             <button onClick={() => setIsManageCatOpen(false)} className="text-slate-400 hover:text-slate-600"><Settings size={16}/></button>
           </div>
           
           <div className="flex flex-wrap gap-3">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 group hover:border-slate-300 transition-colors">
                  <span className="font-bold text-sm text-slate-700">{cat.label}</span>
                  <div className="h-4 w-px bg-slate-200 mx-1"></div>
                  <button
                    onClick={() => { void updateCategory({...cat, isVisible: !cat.isVisible}); }}
                    className={`p-1 rounded hover:bg-slate-100 ${cat.isVisible ? 'text-green-600' : 'text-slate-300'}`}
                    title={cat.isVisible ? "Visible" : "Caché"}
                  >
                    {cat.isVisible ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                  <button 
                    onClick={() => {
                      const newLabel = prompt("Nouveau nom:", cat.label);
                      if (newLabel) { void updateCategory({...cat, label: newLabel}); }
                    }}
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                  >
                    <Edit2 size={14}/>
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const label = prompt("Nom de la catégorie:");
                  if (label) { void addCategory(label); }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:bg-white hover:text-rose-600 hover:border-rose-300 text-sm font-medium transition-all"
              >
                <Plus size={16} /> Nouvelle
              </button>
           </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 mb-8 no-scrollbar bg-white sticky top-0 z-10 pt-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            className={`px-6 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === cat.id
                ? 'border-rose-600 text-rose-600 bg-rose-50/30'
                : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            } ${!cat.isVisible ? 'opacity-50' : ''}`}
          >
            {cat.label}
            {!cat.isVisible && <EyeOff size={14} className="text-slate-400" />}
          </button>
        ))}
      </div>

      {/* Dish List */}
      <div className="flex-1 overflow-y-auto pb-24">
        {activeCategoryDishes.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ChefHat size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">C'est un peu vide ici</h3>
            <p className="text-slate-500 mb-6">Ajoutez votre premier plat dans la catégorie <span className="font-bold">{categories.find(c => c.id === activeTab)?.label}</span>.</p>
            <Button variant="primary" onClick={handleAdd} className="shadow-lg shadow-rose-200">
              <Plus size={18} className="mr-2" /> Ajouter un plat
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            {sortedGroups.map(groupName => {
              const isCollapsed = collapsedGroups[groupName];
              return (
                <div key={groupName} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                  {/* Group Header */}
                  <div 
                    className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-base">
                          {groupName === 'Général' ? 'Plats Généraux' : groupName}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">
                          {groupedDishes[groupName].length} plat{groupedDishes[groupName].length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {groupName !== 'Général' && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                          Sous-catégorie
                        </span>
                      )}
                      <ChevronDown 
                        size={20} 
                        className={`text-slate-400 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} 
                      />
                    </div>
                  </div>

                  {/* List with Smooth Accordion Animation */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="p-4 space-y-4">
                        {groupedDishes[groupName].map((dish, index) => (
                          <div 
                            key={dish.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, dish.id)}
                            onDragEnter={(e) => handleDragEnter(e, dish.id)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className={`group relative bg-white rounded-xl border transition-all hover:shadow-md hover:border-rose-200 flex items-center p-3 sm:p-4 gap-4 ${
                              !dish.isAvailable ? 'bg-slate-50 border-slate-100 opacity-70' : 'border-slate-100'
                            }`}
                          >
                            {/* Drag Handle */}
                            <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-1 hidden sm:block">
                              <GripVertical size={20} />
                            </div>

                            {/* Image */}
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg overflow-hidden shrink-0 relative shadow-inner">
                              {dish.imageUrl ? (
                                <img src={dish.imageUrl} alt={dish.name} className={`w-full h-full object-cover transition-transform group-hover:scale-110 ${!dish.isAvailable ? 'grayscale' : ''}`} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300"><Utensils size={20}/></div>
                              )}
                              {!dish.isAvailable && (
                                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-[1px]">
                                  <EyeOff size={16} className="text-white drop-shadow-md" />
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 py-1">
                              <div className="flex items-start justify-between gap-4">
                                <h3 className={`font-bold text-slate-900 truncate text-base sm:text-lg ${!dish.isAvailable ? 'text-slate-500 line-through decoration-slate-400' : ''}`}>
                                  {dish.name}
                                </h3>
                                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-sm whitespace-nowrap">
                                  {dish.price.toFixed(2)}€
                                </span>
                              </div>
                              
                              <p className="text-xs sm:text-sm text-slate-500 line-clamp-1 mt-1 font-medium">{dish.description}</p>
                              
                              {dish.tags && dish.tags.length > 0 && (
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                  {dish.tags.map(tag => (
                                    <span key={tag} className="text-[10px] uppercase px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 font-bold tracking-wide">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pl-4 border-l border-slate-100">
                              <button 
                                onClick={() => { void duplicateDish(dish); }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Dupliquer"
                              >
                                <Copy size={16} />
                              </button>
                              
                              <button 
                                onClick={() => handleEdit(dish)}
                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={16} />
                              </button>
                              
                              <button 
                                onClick={() => {
                                  if (window.confirm('Supprimer ce plat ?')) { void deleteDish(dish.id); }
                                }}
                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Availability Toggle (Overlay) */}
                            <button 
                              onClick={() => toggleAvailability(dish)}
                              className={`absolute top-2 right-2 w-3 h-3 rounded-full border shadow-sm ${dish.isAvailable ? 'bg-green-500 border-green-600' : 'bg-slate-300 border-slate-400'}`}
                              title={dish.isAvailable ? "En ligne" : "Hors ligne"}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <DishModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSave}
        initialData={editingDish}
        defaultCategoryId={activeTab}
      />
    </div>
  );
};