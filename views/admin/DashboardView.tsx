
import React, { useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { AdminSection } from '../../types';
import { Button } from '../../components/ui/Button';
import { 
  Eye, Utensils, QrCode, Palette, 
  Edit3, TrendingUp, Globe 
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (section: AdminSection) => void;
  onPreview: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onPreview }) => {
  const { profile, updateProfile, dishes, tableCount } = useStore();

  // Stats
  const activeDishesCount = dishes.filter(d => d.isAvailable).length;
  // Mock daily stats
  const dailyViews = 124;
  const topDish = dishes[1]?.name || "Aucun";

  // Completion calculation
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (profile.name) score += 20;
    if (profile.address) score += 20;
    if (profile.openingHours) score += 20;
    if (profile.logoUrl) score += 20;
    if (profile.coverUrl) score += 20;
    return score;
  }, [profile]);

  const toggleStatus = () => {
    updateProfile({ ...profile, isOnline: !profile.isOnline });
  };

  const updateTheme = () => {
    const colors = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed'];
    const currentIdx = colors.indexOf(profile.themeColor);
    const nextColor = colors[(currentIdx + 1) % colors.length];
    updateProfile({ ...profile, themeColor: nextColor });
  };

  // Safe opening hours display
  const todayHours = profile.openingHours || "Horaires non définis";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="text-slate-500">Vue d'ensemble de votre restaurant.</p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Eye size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Vues du menu (Auj.)</p>
            <p className="text-2xl font-bold text-slate-900">{dailyViews}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Plats actifs</p>
            <p className="text-2xl font-bold text-slate-900">{activeDishesCount}</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => onNavigate('QR')}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-400">QR Codes Tables</p>
              <p className="font-bold">{tableCount} générés</p>
            </div>
          </div>
          <div className="text-xs font-bold bg-white text-slate-900 px-3 py-1 rounded-full">
            Voir
          </div>
        </div>
      </div>

      {/* Restaurant Command Center Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden relative">
        {/* Cover Image */}
        <div className="h-48 w-full bg-slate-200 relative">
          <img src={profile.coverUrl} className="w-full h-full object-cover opacity-90" alt="Cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Status Badge */}
          <button 
            onClick={toggleStatus}
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:scale-105 ${
              profile.isOnline 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-slate-600 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <div className={`w-2 h-2 rounded-full bg-current ${profile.isOnline ? 'animate-pulse' : ''}`} />
            {profile.isOnline ? 'En ligne' : 'Masqué'}
          </button>
        </div>

        {/* Card Body */}
        <div className="px-6 pb-6 relative">
          {/* Logo Avatar */}
          <div className="absolute -top-12 left-6">
            <img 
              src={profile.logoUrl} 
              className="w-24 h-24 rounded-full border-4 border-white bg-white object-cover shadow-md"
              alt="Logo"
            />
          </div>

          {/* Identity & Status */}
          <div className="pt-14 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">{profile.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-sm font-medium ${profile.isOnline ? 'text-green-600' : 'text-slate-500'}`}>
                  {profile.isOnline ? 'Ouvert' : 'Fermé'} • {todayHours}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Globe size={12} /> {profile.city}
                </span>
              </div>
            </div>

            {/* Completion Bar */}
            <div className="w-full sm:w-64">
              <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                <span>Profil complété</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-rose-500 transition-all duration-1000" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              {completionPercentage < 100 && (
                <p className="text-[10px] text-rose-600 mt-1 font-medium">Ajoutez une photo de couverture pour atteindre 100%</p>
              )}
            </div>
          </div>

          {/* Performance Ticker */}
          <div className="mt-6 bg-slate-50 rounded-lg p-3 flex items-start gap-3 border border-slate-100">
            <TrendingUp size={16} className="text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">Tendance aujourd'hui :</span> Le <span className="italic">"{topDish}"</span> est votre plat le plus consulté avec {Math.floor(dailyViews * 0.4)} vues uniques.
            </p>
          </div>

          {/* Quick Actions Toolbar */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
            <Button onClick={() => onNavigate('PROFILE')} className="gap-2 shadow-sm">
              <Edit3 size={16} />
              Éditer les infos
            </Button>
            
            <Button variant="secondary" onClick={updateTheme} className="gap-2 border border-slate-200 bg-white hover:bg-slate-50 group">
              <Palette size={16} style={{ color: profile.themeColor }} />
              <span className="group-hover:text-slate-900">Apparence</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
