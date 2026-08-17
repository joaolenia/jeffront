import React, { useState } from 'react';
import type { Mercadoria } from './types';
import { MercadoriasList } from './MercadoriasList';
import { MercadoriaDetalhes } from './MercadoriaDetalhes';
import { MercadoriaCadastro } from './MercadoriaCadastro';

const MOCK_INICIAL: Mercadoria[] = [
  // ... seus dados iniciais de teste aqui ...
];

export function Mercadorias() {
  const [mercadorias, setMercadorias] = useState<Mercadoria[]>(MOCK_INICIAL);
  const [view, setView] = useState<'lista' | 'detalhes' | 'cadastro'>('lista');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handlePagarParcela = (idMerc: number, parcelaNum: number, origem: 'caixa'|'cofre') => {
    setMercadorias(prev => prev.map(m => {
      if (m.id === idMerc) {
        const parcelasAtualizadas = m.parcelasBoleto.map(p => 
          p.numero === parcelaNum ? { ...p, status: 'paga' as const, origemPgto: origem } : p
        );
        const tudoPago = parcelasAtualizadas.every(p => p.status === 'paga');
        return { ...m, parcelasBoleto: parcelasAtualizadas, status: tudoPago ? 'paga' : m.status };
      }
      return m;
    }));
  };

  const handleSalvarNova = (nova: Mercadoria) => {
    setMercadorias([nova, ...mercadorias]);
    setView('lista');
  };

  return (
    <div style={{ padding: '24px 32px', height: 'calc(100vh - 70px)', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      {view === 'lista' && (
        <MercadoriasList 
          mercadorias={mercadorias} 
          onSelect={(id) => { setSelectedId(id); setView('detalhes'); }} 
          onNovoCadastro={() => setView('cadastro')} 
        />
      )}
      
      {view === 'detalhes' && selectedId && (
        <MercadoriaDetalhes 
          mercadoria={mercadorias.find(m => m.id === selectedId)!}
          onVoltar={() => setView('lista')}
          onPagarParcela={handlePagarParcela}
        />
      )}

      {view === 'cadastro' && (
        <MercadoriaCadastro 
          onSalvar={handleSalvarNova} 
          onCancelar={() => setView('lista')} 
        />
      )}
    </div>
  );
}