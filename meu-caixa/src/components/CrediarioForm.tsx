import React, { useState, useEffect } from 'react';
import { Search, Plus, User, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import api from '../api';
import './CrediarioForm.css';

export interface Ficha {
  id: number;
  clienteNome: string;
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

// Adicionada a etapa 'CREATE'
type Step = 'SEARCH' | 'CREATE' | 'CONFIRM';

export function CrediarioForm({ totalVenda, onConfirm, onClose }: CrediarioFormProps) {
  const [step, setStep] = useState<Step>('SEARCH');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ficha[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  
  // Estados para o novo cadastro
  const [novoNome, setNovoNome] = useState('');

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (step === 'SEARCH') {
      document.getElementById('search-cliente')?.focus();
    } else if (step === 'CREATE') {
      document.getElementById('input-novo-nome')?.focus();
    }
  }, [step]);

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

  const openCreateForm = () => {
    // Pré-preenche o nome com o que o usuário já havia digitado na busca
    setNovoNome(searchQuery);
    setError(null);
    setStep('CREATE');
  };

  const handleCreateFicha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      setError('O nome do cliente é obrigatório.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const novaFicha = {
        clienteNome: novoNome.trim(),
        compras: [],
        pagamentos: [],
        valorTotal: 0,
        valorPago: 0,
        status: 'ABERTA'
      };
      
      const response = await api.post('/fichas', novaFicha);
      const fichaCriada = response.data;
      
      setSelectedFicha(fichaCriada);
      setStep('CONFIRM');
    } catch (err) {
      console.error('Erro ao criar ficha', err);
      setError('Não foi possível cadastrar o cliente. Verifique a conexão.');
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
      await onConfirm(selectedFicha);
    } catch (err) {
      setError('Erro ao processar venda no crediário.');
      setIsSubmitting(false);
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
            <div className="error-message">
              <AlertCircle size={20} /> {error}
            </div>
          )}

          {step === 'SEARCH' && (
            <>
              <form className="search-box" onSubmit={handleSearch}>
                <input
                  id="search-cliente"
                  type="text"
                  placeholder="Buscar cliente por nome..."
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
                  <p>Nenhuma ficha encontrada para <strong>"{searchQuery}"</strong>.</p>
                  <button className="btn-create-ficha" onClick={openCreateForm} type="button">
                    <Plus size={20} /> Cadastrar Cliente
                  </button>
                </div>
              )}

              {searched && !loading && searchResults.length > 0 && (
                <div className="fichas-list">
                  <p className="results-title">Clientes encontrados:</p>
                  {searchResults.map(ficha => (
                    <div key={ficha.id} className="ficha-card" onClick={() => handleSelectFicha(ficha)}>
                      <div className="ficha-info">
                        <h4>{ficha.clienteNome}</h4>
                        <p>ID da Ficha: #{ficha.id}</p>
                      </div>
                      <div className="ficha-saldo">
                        <span>Saldo Devedor</span>
                        <div className="valor">
                          {formatCurrency(Number(ficha.valorTotal) - Number(ficha.valorPago))}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="create-alternative">
                     <p>O cliente não está na lista?</p>
                     <button className="btn-create-ficha outline" onClick={openCreateForm} type="button">
                       <Plus size={18} /> Novo Cadastro
                     </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'CREATE' && (
            <div className="create-step">
              <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Novo Cadastro de Cliente</h3>
              <form onSubmit={handleCreateFicha} className="create-form">
                
                <div className="form-group">
                  <label htmlFor="input-novo-nome">Nome Completo *</label>
                  <input 
                    id="input-novo-nome"
                    type="text" 
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Digite o nome do cliente"
                    disabled={loading}
                    required
                  />
                </div>


                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button 
                    type="button"
                    className="btn-modal btn-cancel" 
                    onClick={() => setStep('SEARCH')}
                    disabled={loading}
                  >
                    Voltar
                  </button>
                  <button 
                    type="submit"
                    className="btn-modal btn-confirm" 
                    style={{ background: '#10b981' }}
                    disabled={loading || !novoNome.trim()}
                  >
                    {loading ? <Loader2 size={20} className="loading-spinner"/> : <Plus size={20}/>}
                    Salvar e Continuar
                  </button>
                </div>

              </form>
            </div>
          )}

          {step === 'CONFIRM' && selectedFicha && (
            <div className="confirm-step">
              <div className="selected-client-card">
                <CheckCircle size={40} color="#10b981" className="success-icon" />
                <h3>{selectedFicha.clienteNome}</h3>                
                <div className="financial-summary">
                  <div className="summary-row">
                    <span>Saldo em aberto atual:</span>
                    <span className="value">
                      {formatCurrency(Number(selectedFicha.valorTotal) - Number(selectedFicha.valorPago))}
                    </span>
                  </div>
                  <div className="summary-row highlight">
                    <span>Valor desta compra:</span>
                    <span className="value">
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
                  Cancelar
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