import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Dish, Category, AVAILABLE_TAGS } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useStore } from '../context/StoreContext';

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dish: Dish) => Promise<void> | void;
  initialData?: Dish;
  defaultCategoryId?: string;
}

export const DishModal: React.FC<DishModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  defaultCategoryId 
}) => {
  const { categories, dishes } = useStore();
  
  const [formData, setFormData] = useState<Partial<Dish>>({
    name: '',
    price: 0,
    categoryId: '',
    subCategory: '',
    description: '',
    imageUrl: '',
    isAvailable: true,
    tags: []
  });

  // Calculate existing subcategories for the selected category to provide suggestions
  const existingSubCategories = React.useMemo(() => {
    const activeCatId = formData.categoryId || defaultCategoryId || categories[0]?.id;
    if (!activeCatId) return [];
    
    const subCats = new Set(
      dishes
        .filter(d => d.categoryId === activeCatId && d.subCategory)
        .map(d => d.subCategory!)
    );
    return Array.from(subCats).sort();
  }, [dishes, formData.categoryId, defaultCategoryId, categories]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name: '',
          price: 0,
          categoryId: defaultCategoryId || categories[0]?.id || '',
          subCategory: '',
          description: '',
          imageUrl: '',
          isAvailable: true,
          tags: []
        });
      }
    }
  }, [isOpen, initialData, defaultCategoryId, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: initialData?.id || Date.now().toString(),
      name: formData.name || 'Nouveau Plat',
      price: Number(formData.price) || 0,
      categoryId: formData.categoryId || categories[0]?.id,
      subCategory: formData.subCategory || '',
      description: formData.description || '',
      imageUrl: formData.imageUrl || '',
      isAvailable: formData.isAvailable ?? true,
      tags: formData.tags || []
    });
    onClose();
  };

  const toggleTag = (tag: string) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? 'Modifier le plat' : 'Ajouter un plat'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="dish-form" onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nom du plat"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="ex: Bruschetta"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prix (€)"
                type="number"
                min="0"
                step="0.5"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <select
                  value={formData.categoryId}
                  onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Input
                label="Groupe / Sous-catégorie (optionnel)"
                value={formData.subCategory}
                onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                placeholder="ex: Premium, Classiques..."
                list="subcategory-suggestions"
              />
              <datalist id="subcategory-suggestions">
                {existingSubCategories.map(sub => (
                  <option key={sub} value={sub} />
                ))}
              </datalist>
              <p className="text-xs text-slate-400 mt-1">
                Utilisez un groupe existant ou créez-en un nouveau (ex: "Vins Rouges").
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ingrédients, provenance..."
              />
            </div>

            <Input
              label="URL Photo (optionnel)"
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags / Mentions</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors flex items-center gap-1 ${
                      formData.tags?.includes(tag)
                        ? 'bg-rose-100 border-rose-200 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {formData.tags?.includes(tag) && <Check size={12} />}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
               <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${formData.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`} onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${formData.isAvailable ? 'translate-x-4' : ''}`} />
               </div>
               <span className="text-sm font-medium text-slate-700">
                 {formData.isAvailable ? 'Disponible à la commande' : 'Marqué comme indisponible'}
               </span>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="submit" form="dish-form">Enregistrer</Button>
        </div>
      </div>
    </div>
  );
};