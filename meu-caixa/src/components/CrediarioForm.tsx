import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';
import './CrediarioForm.css';

export interface Ficha {
  id: number;
  clienteNome: string;
  telefone?: string;
  compras: any[];
  pagamentos: any[];
  valorTotal: number;
  valorPago: number;
  status: string;
}

interface CrediarioFormProps {
  totalVenda: number;
  onConfirm: (ficha: Ficha) => Promise<void>;
  onClose: () => void;
}

type Step = 'SEARCH' | 'CONFIRM';

export function CrediarioForm({ totalVenda, onConfirm, onClose }: CrediarioFormProps) {
  const [step, setStep] = useState<Step>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ficha[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  // Foca no input ao abrir
  useEffect(() => {
    const input = document.getElementById('search-cliente');
    if (input) input.focus();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const response = await api.get(`/fichas/busca/${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data || []);
    } catch (err) {
      console.error('Erro na busca de ficha', err);
      setError('Erro ao comunicar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFicha = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const novaFicha = {
        clienteNome: searchQuery.trim(),
        compras: [],
        pagamentos: [],
        valorTotal: 0,
        valorPago: 0,
        status: 'ABERTA'
      };
      
      const response = await api.post('/fichas', novaFicha);
      const fichaCriada = response.data;
      
      // Seleciona automaticamente e vai para confirmação
      setSelectedFicha(fichaCriada);
      setStep('CONFIRM');
    } catch (err) {
      console.error('Erro ao criar ficha', err);
      setError('Não foi possível criar a ficha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFicha = (ficha: Ficha) => {
    setSelectedFicha(ficha);
    setStep('CONFIRM');
  };

  const handleConfirmSale = async () => {
    if (!selectedFicha || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      // Chama o callback do PDV passando a ficha, ele cuidará de salvar a venda e atualizar a ficha
      await onConfirm(selectedFicha);
    } catch (err) {
      setError('Erro ao processar venda no crediário.');
      setIsSubmitting(false); // Só libera se deu erro, sucesso vai fechar o modal
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="crediario-modal-overlay">
      <div className="crediario-modal-content">
        
        <div className="crediario-modal-header">
          <h2><User size={24} color="#3b82f6" /> Venda no Crediário</h2>
          <button className="btn-close" onClick={onClose} disabled={isSubmitting}>
            <X size={24} />
          </button>
        </div>

        <div className="crediario-modal-body">
          {error && (
            <div style={{ padding: '12px', background: '#fee2e2', color: '#ef4444', borderRadius: '8px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {step === 'SEARCH' && (
            <>
              <form className="search-box" onSubmit={handleSearch}>
                <input
                  id="search-cliente"
                  type="text"
                  placeholder="Digite o nome do cliente..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" className="btn-search" disabled={loading || !searchQuery.trim()}>
                  {loading ? <Loader2 size={20} className="loading-spinner" /> : <Search size={20} />}
                  Buscar
                </button>
              </form>

              {searched && !loading && searchResults.length === 0 && (
                <div className="empty-state">
                  <User size={48} opacity={0.3} />
                  <p>Nenhum cliente encontrado com o nome <strong>"{searchQuery}"</strong>.</p>
                  <button className="btn-create-ficha" onClick={handleCreateFicha} type="button">
                    <Plus size={20} /> Criar nova ficha
                  </button>
                </div>
              )}

              {searched && !loading && searchResults.length > 0 && (
                <div className="fichas-list">
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#64748b' }}>Clientes encontrados:</p>
                  {searchResults.map(ficha => (
                    <div key={ficha.id} className="ficha-card" onClick={() => handleSelectFicha(ficha)}>
                      <div className="ficha-info">
                        <h4>{ficha.clienteNome}</h4>
                        <p>ID da Ficha: #{ficha.id}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Saldo Devedor</span>
                        <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                          {formatCurrency(Number(ficha.valorTotal) - Number(ficha.valorPago))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '16px', textAlign: 'center' }}>
                     <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>O cliente não está na lista?</p>
                     <button className="btn-create-ficha" style={{ margin: '0 auto' }} onClick={handleCreateFicha} type="button">
                       <Plus size={18} /> Criar "{searchQuery}"
                     </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'CONFIRM' && selectedFicha && (
            <div className="confirm-step">
              <div className="selected-client-card">
                <CheckCircle size={40} color="#10b981" style={{ marginBottom: '12px' }} />
                <h3>{selectedFicha.clienteNome}</h3>
                
                <div className="financial-summary">
                  <div className="summary-row">
                    <span>Saldo em aberto atual:</span>
                    <span className="value">
                      {formatCurrency(Number(selectedFicha.valorTotal) - Number(selectedFicha.valorPago))}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Valor desta compra:</span>
                    <span className="value" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                      + {formatCurrency(totalVenda)}
                    </span>
                  </div>
                  <div className="summary-row total">
                    <span>Novo Saldo Devedor:</span>
                    <span className="value">
                      {formatCurrency((Number(selectedFicha.valorTotal) - Number(selectedFicha.valorPago)) + totalVenda)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-modal btn-cancel" 
                  onClick={() => setStep('SEARCH')}
                  disabled={isSubmitting}
                >
                  Voltar
                </button>
                <button 
                  className="btn-modal btn-confirm" 
                  onClick={handleConfirmSale}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 size={20} className="loading-spinner"/> : <CheckCircle size={20}/>}
                  Confirmar Venda
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}