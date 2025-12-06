
import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { QrCode, RefreshCw, Download, ExternalLink } from 'lucide-react';

export const QRView: React.FC = () => {
  const { tableCount, setTableCount, profile, updateProfile } = useStore();
  
  // Local state for configuration form to prevent jitter while typing
  const [localSlug, setLocalSlug] = useState(profile.slug || 'demo-1');
  const [localTableCount, setLocalTableCount] = useState(tableCount);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setLocalSlug(profile.slug);
    setLocalTableCount(tableCount);
  }, [profile.slug, tableCount]);

  const handleUpdate = () => {
    setIsGenerating(true);
    // Simulate processing delay for better UX
    setTimeout(async () => {
      setTableCount(Math.max(1, localTableCount));
      await updateProfile({ ...profile, slug: localSlug });
      setIsGenerating(false);
    }, 500);
  };

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  // Helper to generate the exact URL requested
  const getMenuUrl = (tableId: number) => {
    return `http://localhost:3000/menu/${profile.slug}?table=${tableId}`;
  };

  const getQrUrl = (url: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}&color=000000&bgcolor=ffffff&margin=10`;
  };

  return (
    <div className="max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Gestion des QR Codes</h2>
        <p className="text-slate-500">Configurez et générez les QR codes pour vos tables.</p>
      </div>

      {/* Configuration Block */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-2">
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:flex-1">
            <Input 
              label="Slug du restaurant" 
              value={localSlug}
              onChange={(e) => setLocalSlug(e.target.value)}
              placeholder="ex: mon-restaurant"
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-400 mt-1">Identifiant unique dans l'URL.</p>
          </div>
          
          <div className="w-full md:w-40">
            <Input 
              label="Nombre de tables" 
              type="number"
              min="1"
              max="100"
              value={localTableCount}
              onChange={(e) => setLocalTableCount(parseInt(e.target.value) || 0)}
            />
          </div>

          <Button 
            onClick={handleUpdate} 
            disabled={isGenerating}
            className="w-full md:w-auto mb-[2px] bg-slate-900 hover:bg-slate-800 text-white min-w-[160px]"
          >
            {isGenerating ? (
              <RefreshCw size={18} className="animate-spin mr-2" />
            ) : (
              <RefreshCw size={18} className="mr-2" />
            )}
            {isGenerating ? 'Mise à jour...' : 'Mettre à jour les QR'}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map(num => {
            const menuUrl = getMenuUrl(num);
            const qrImageUrl = getQrUrl(menuUrl);

            return (
              <div key={num} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group">
                {/* Header */}
                <div className="w-full flex justify-between items-center mb-2 px-1">
                  <h3 className="font-bold text-slate-900">Table {num}</h3>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>

                {/* QR Image */}
                <div className="w-full aspect-square bg-slate-50 rounded-md overflow-hidden relative mb-3 border border-slate-100">
                  <img 
                    src={qrImageUrl} 
                    alt={`QR Table ${num}`}
                    className="w-full h-full object-contain p-2 mix-blend-multiply"
                    loading="lazy"
                  />
                </div>

                {/* URL Display */}
                <div className="w-full bg-slate-50 rounded border border-slate-100 px-2 py-1 mb-3 overflow-hidden">
                  <p className="text-[10px] text-slate-500 font-mono truncate select-all text-center" title={menuUrl}>
                    .../menu/{profile.slug}?table={num}
                  </p>
                </div>

                {/* Action */}
                <a 
                  href={qrImageUrl} 
                  download={`qrcode-table-${num}.png`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600 rounded text-xs font-bold transition-colors"
                >
                  <Download size={12} />
                  PNG
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
