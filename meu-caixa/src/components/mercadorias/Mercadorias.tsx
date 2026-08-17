// src/components/mercadorias/Mercadorias.tsx
import  { useState } from 'react';
import type { Mercadoria } from './types';
import { MercadoriasList } from './MercadoriasList';
import { MercadoriaDetalhes } from './MercadoriaDetalhes';
import { MercadoriaCadastro } from './MercadoriaCadastro';

// --- MOCKS ---
const MOCK_DATA: Mercadoria[] = [
  {
    id: 1,
    fornecedor: 'Coca-Cola (Femsa)',
    data: '17/08/2026',
    valorTotal: 4500.00,
    status: 'pendente',
    pagamento: { caixa: 1500, cofre: 0, boleto: 3000 },
    parcelasBoleto: [
      { numero: 1, valor: 1500, vencimento: '17/09/2026', status: 'pendente' },
      { numero: 2, valor: 1500, vencimento: '17/10/2026', status: 'pendente' }
    ]
  },
  {
    id: 2,
    fornecedor: 'Frigorífico Silva',
    data: '15/08/2026',
    valorTotal: 1200.00,
    status: 'paga',
    pagamento: { caixa: 0, cofre: 1200, boleto: 0 },
    parcelasBoleto: []
  },
  {
    id: 3,
    fornecedor: 'Distribuidora de Embalagens',
    data: '10/08/2026',
    valorTotal: 850.50,
    status: 'pendente',
    pagamento: { caixa: 0, cofre: 0, boleto: 850.50 },
    parcelasBoleto: [
      { numero: 1, valor: 850.50, vencimento: '10/09/2026', status: 'paga', origemPgto: 'caixa' }
    ]
  }
];

export function Mercadorias() {
  const [mercadorias, setMercadorias] = useState<Mercadoria[]>(MOCK_DATA);
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

  const selectedMercadoria = mercadorias.find(m => m.id === selectedId);

  return (
    <div style={{ padding: '32px', height: 'calc(100vh - 70px)', overflowY: 'auto', backgroundColor: '#f1f5f9', boxSizing: 'border-box' }}>
      
      {view === 'lista' && (
        <MercadoriasList 
          mercadorias={mercadorias} 
          onSelect={(id) => { setSelectedId(id); setView('detalhes'); }} 
          onNovoCadastro={() => setView('cadastro')} 
        />
      )}
      
      {view === 'detalhes' && selectedMercadoria && (
        <MercadoriaDetalhes 
          mercadoria={selectedMercadoria}
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