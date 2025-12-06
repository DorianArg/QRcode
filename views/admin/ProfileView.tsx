
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Save, Layout, MapPin, Phone, Clock, ImageIcon, Palette, Globe, AlignLeft } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { profile, updateProfile } = useStore();
  const [formData, setFormData] = useState(profile);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setMessage('Informations mises à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil', error);
      setMessage('Erreur lors de la mise à jour.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Gestion du Restaurant</h2>
        <p className="text-slate-500">Modifiez les informations visibles sur votre menu digital.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Identity & Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <Layout size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">Identité & Statut</h3>
          </div>
          
          <div className="p-6 grid gap-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200">
               <div>
                 <span className="block font-bold text-slate-900">Statut du Menu</span>
                 <span className="text-sm text-slate-500">Rendre le menu visible ou invisible pour les clients.</span>
               </div>
               <div 
                 className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors ${formData.isOnline ? 'bg-green-500' : 'bg-slate-300'}`} 
                 onClick={() => setFormData({ ...formData, isOnline: !formData.isOnline })}
               >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-sm transform transition-transform ${formData.isOnline ? 'translate-x-6' : ''}`} />
               </div>
            </div>

            <Input
              label="Nom du Restaurant"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              className="text-lg font-bold"
            />
            
            <Input
              label="Slogan / Phrase d'accroche"
              value={formData.tagline}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="ex: Cuisine traditionnelle & Saveurs du terroir"
            />
          </div>
        </div>

        {/* Section 2: Contact & Hours */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <MapPin size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">Coordonnées & Horaires</h3>
          </div>
          
          <div className="p-6 grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Adresse (Rue)"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="ex: 12 Rue Paoli"
                  />
                  <Input
                    label="Ville"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    required
                    placeholder="ex: Bonifacio"
                  />
               </div>
               <Input
                label="Numéro de téléphone"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="ex: 04 95 ..."
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Texte des horaires</label>
              <Input
                value={formData.openingHours}
                onChange={e => setFormData({ ...formData, openingHours: e.target.value })}
                placeholder="ex: Mar-Dim: 12h - 23h"
              />
              <p className="text-xs text-slate-500 bg-blue-50 text-blue-700 p-2 rounded flex gap-2">
                <Clock size={14} className="shrink-0 mt-0.5" />
                Ce texte s'affiche après "Ouvert/Fermé" sur le menu client.
              </p>
            </div>
          </div>
          
          <div className="px-6 pb-6 pt-0 border-t border-slate-100 mt-4 pt-4">
             <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
               <AlignLeft size={16} /> Texte de pied de page (Footer)
             </label>
             <textarea
               className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 min-h-[80px]"
               value={formData.footerText || ''}
               onChange={e => setFormData({ ...formData, footerText: e.target.value })}
               placeholder="ex: Merci de votre visite ! Produits frais et locaux."
             />
          </div>
        </div>

        {/* Section 3: Visuals & Branding */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
           <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
            <ImageIcon size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-800">Apparence & Marque</h3>
          </div>
          
          <div className="p-6 space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Input
                    label="URL du Logo"
                    value={formData.logoUrl}
                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  <div className="mt-4 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border-2 border-slate-100 shadow-sm overflow-hidden bg-slate-50 flex items-center justify-center">
                       {formData.logoUrl ? (
                         <img src={formData.logoUrl} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'}/>
                       ) : <span className="text-xs text-slate-400">Aucun</span>}
                    </div>
                    <span className="text-xs text-slate-500">Aperçu du logo<br/>(Format carré recommandé)</span>
                  </div>
                </div>

                <div>
                  <Input
                    label="URL Image de Couverture"
                    value={formData.coverUrl}
                    onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                    placeholder="https://..."
                  />
                   <div className="mt-4 w-full h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 relative">
                       {formData.coverUrl ? (
                         <img src={formData.coverUrl} className="w-full h-full object-cover opacity-80" onError={(e) => e.currentTarget.style.display='none'}/>
                       ) : <div className="flex items-center justify-center h-full text-xs text-slate-400">Aucune couverture</div>}
                       <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-[10px] rounded">Aperçu Bannière</div>
                    </div>
                </div>
             </div>

             <div className="pt-4 border-t border-slate-100">
               <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                 <Palette size={16} /> Couleur du Thème
               </label>
               <div className="flex items-center gap-4">
                 <input 
                   type="color" 
                   value={formData.themeColor}
                   onChange={e => setFormData({ ...formData, themeColor: e.target.value })}
                   className="h-12 w-24 p-1 rounded-lg border border-slate-300 cursor-pointer shadow-sm"
                 />
                 <div className="text-sm text-slate-600">
                   <p className="font-bold">Couleur principale</p>
                   <p className="text-xs">Utilisée pour les boutons, prix et accents.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Footer Actions (Static at bottom) */}
        <div className="mt-8 flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 text-sm">
               {message && <span className="text-green-400 font-bold animate-pulse">{message}</span>}
               {!message && <span className="text-slate-400">N'oubliez pas d'enregistrer vos modifications.</span>}
            </div>
            <Button type="submit" size="lg" className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg border-transparent">
              <Save size={18} className="mr-2" />
              Enregistrer
            </Button>
        </div>
      </form>
    </div>
  );
};
