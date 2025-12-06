import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Button } from '../../components/ui/Button';
import { TableSession } from '../../types';
import { Clock, Euro, Users, CheckCircle, RotateCcw } from 'lucide-react';

export const OrdersView: React.FC = () => {
  const { tableCount, tableSessions, resetTable } = useStore();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const getTableStatusColor = (session?: TableSession) => {
    if (!session) return 'bg-slate-50 border-slate-200'; // FREE
    if (session.status === 'PAID') return 'bg-green-50 border-green-200';
    if (session.status === 'PARTIAL') return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200'; // OCCUPIED
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'PAID': return 'Payé';
      case 'PARTIAL': return 'Paiement partiel';
      case 'OCCUPIED': return 'En cours';
      default: return 'Libre';
    }
  };

  const selectedSession = selectedTableId ? tableSessions[selectedTableId] : null;

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Main Grid */}
      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Caisse & Tables</h2>
          <p className="text-slate-500">Suivi en temps réel de la salle.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {tables.map(tableId => {
            const session = tableSessions[tableId];
            const isSelected = selectedTableId === tableId;
            
            return (
              <button
                key={tableId}
                onClick={() => setSelectedTableId(tableId)}
                className={`p-4 rounded-xl border-2 text-left transition-all relative ${
                  isSelected ? 'ring-2 ring-rose-500 ring-offset-2' : ''
                } ${getTableStatusColor(session)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg text-slate-900">Table {tableId}</span>
                  {session && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      session.status === 'PAID' ? 'bg-green-200 text-green-800' :
                      session.status === 'PARTIAL' ? 'bg-amber-200 text-amber-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {getStatusLabel(session.status)}
                    </span>
                  )}
                </div>

                {session ? (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Euro size={12} />
                      <span className={session.paidAmount < session.totalAmount ? 'font-bold text-slate-900' : ''}>
                        Reste: {(session.totalAmount - session.paidAmount).toFixed(2)}€
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={12} />
                      <span>{Math.floor((Date.now() - session.startTime) / 60000)} min</span>
                    </div>
                  </div>
                ) : (
                   <span className="text-xs text-slate-400 block mt-4">Aucune commande</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail Sidebar */}
      <div className="w-full lg:w-96 bg-white border-l border-slate-200 -my-4 sm:-my-8 p-6 overflow-y-auto">
        {selectedTableId ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-xl font-bold text-slate-900">Détail Table {selectedTableId}</h3>
               {selectedSession && (selectedSession.status === 'PAID' || selectedSession.status === 'FREE') && (
                 <Button 
                   size="sm" 
                   variant="secondary" 
                   onClick={() => {
                     if(window.confirm('Libérer cette table ?')) {
                       resetTable(selectedTableId);
                       setSelectedTableId(null);
                     }
                   }}
                   className="text-xs"
                 >
                   <RotateCcw size={14} className="mr-1"/> Libérer
                 </Button>
               )}
            </div>

            {selectedSession ? (
              <div className="flex-1 flex flex-col">
                 {/* Summary Card */}
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-slate-500">Total Table</span>
                      <span className="font-bold text-lg">{selectedSession.totalAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm text-green-600">
                      <span>Déjà réglé</span>
                      <span>- {selectedSession.paidAmount.toFixed(2)} €</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-rose-600 text-lg">
                      <span>Reste à payer</span>
                      <span>{(selectedSession.totalAmount - selectedSession.paidAmount).toFixed(2)} €</span>
                    </div>
                 </div>

                 <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wide">Articles commandés</h4>
                 <div className="flex-1 overflow-y-auto space-y-3 mb-6">
                   {selectedSession.items.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center text-sm">
                       <div className="flex items-center gap-2">
                         <span className="bg-slate-200 text-slate-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded">
                           {item.quantity}
                         </span>
                         <span className="text-slate-700">{item.name}</span>
                       </div>
                       <span className="text-slate-500">{(item.price * item.quantity).toFixed(2)} €</span>
                     </div>
                   ))}
                 </div>

                 {selectedSession.status === 'PAID' && (
                   <div className="bg-green-100 text-green-800 p-4 rounded-lg flex items-center justify-center gap-2 font-bold animate-in fade-in zoom-in">
                     <CheckCircle size={20} />
                     Table Réglée
                   </div>
                 )}
              </div>
            ) : (
              <div className="text-center text-slate-400 mt-10">
                <Users size={48} className="mx-auto mb-4 opacity-20" />
                <p>Table libre.</p>
                <p className="text-sm">En attente de clients...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <p>Sélectionnez une table pour voir le détail.</p>
          </div>
        )}
      </div>
    </div>
  );
};