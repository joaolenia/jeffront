import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import './MercadoriaCadastro.css';

interface ParcelaPayload {
  numero: number;
  valor: number;
  vencimento: string;
  status: string;
  formaPagamento: string;
}

interface Props {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function MercadoriaCadastro({ onSuccess, onCancelar }: Props) {
  const [fornecedor, setFornecedor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  
  const [usaCaixa, setUsaCaixa] = useState(false);
  const [valCaixa, setValCaixa] = useState('');
  const [usaCofre, setUsaCofre] = useState(false);
  const [valCofre, setValCofre] = useState('');
  const [usaBoleto, setUsaBoleto] = useState(false);
  const [valBoleto, setValBoleto] = useState('');
  
  const [parcelas, setParcelas] = useState('1');
  const [vencimento, setVencimento] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numTotal = parseFloat(valorTotal) || 0;
  const numCaixa = usaCaixa ? (parseFloat(valCaixa) || 0) : 0;
  const numCofre = usaCofre ? (parseFloat(valCofre) || 0) : 0;
  const numBoleto = usaBoleto ? (parseFloat(valBoleto) || 0) : 0;
  
  // Utiliza toFixed para evitar pequenos bugs de precisão do JS (ex: 0.1 + 0.2)
  const somaPagamentos = Number((numCaixa + numCofre + numBoleto).toFixed(2));
  const restante = Number((numTotal - somaPagamentos).toFixed(2));
  
  const isFormValid = numTotal > 0 && restante === 0 && fornecedor.trim() !== '';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Helper para gerar YYYY-MM-DD de forma segura usando timezone local
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    const parcelasArray: ParcelaPayload[] = [];
    if (usaBoleto && numBoleto > 0) {
      const qtd = parseInt(parcelas) || 1;
      const valorPorParcela = numBoleto / qtd;
      
      // Adicionando T12:00:00 para forçar o meio do dia e evitar transição de data por fuso
      let dataBase = vencimento ? new Date(`${vencimento}T12:00:00`) : new Date();
      
      for (let i = 1; i <= qtd; i++) {
        const dataVenc = new Date(dataBase);
        dataVenc.setDate(dataVenc.getDate() + ((i - 1) * 30));
        
        parcelasArray.push({
          numero: i,
          valor: Number(valorPorParcela.toFixed(2)),
          vencimento: formatDateLocal(dataVenc), // Gera 'YYYY-MM-DD'
          status: 'pendente',
          formaPagamento: 'Boleto'
        });
      }
    }

    const payload = {
      fornecedorNome: fornecedor,
      observacao: observacao.trim() === '' ? null : observacao,
      valorNota: numTotal,
      valorPagoCaixa: numCaixa,
      valorPagoCofre: numCofre,
      valorPrazo: numBoleto,
      statusGeral: (usaBoleto && numBoleto > 0) ? 'pendente' : 'concluido',
      dataOperacao: formatDateLocal(new Date()), // Gera 'YYYY-MM-DD' da data atual local
      parcelas: parcelasArray
    };

    try {
      setIsSubmitting(true);
      await api.post('/mercadorias', payload);
      alert('Mercadoria registrada com sucesso!');
      onSuccess(); 
    } catch (error) {
      console.error('Erro ao salvar mercadoria:', error);
      alert('Ocorreu um erro ao tentar salvar a operação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mcad-container">
      <div className="mcad-header">
        <button onClick={onCancelar} style={{background: 'none', border: 'none', cursor: 'pointer'}} disabled={isSubmitting}>
          <ArrowLeft size={28} color="#64748b" />
        </button>
        <h2 style={{margin: 0, fontSize: '1.8rem', color: '#0f172a'}}>Registrar Mercadoria</h2>
      </div>

      <div className="mcad-row">
        <div className="mcad-group">
          <label>Nome do Fornecedor *</label>
          <input className="mcad-input" value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: Coca-Cola, Ambev..." autoFocus />
        </div>
        <div className="mcad-group">
          <label>Valor Total da Nota (R$) *</label>
          <input type="number" step="0.01" className="mcad-input" value={valorTotal} onChange={e => setValorTotal(e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div className="mcad-group" style={{ marginBottom: '24px' }}>
        <label>Observação (Opcional)</label>
        <input className="mcad-input" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: Material de limpeza, bebidas para o final de semana..." />
      </div>

      <div className="mcad-split-box">
        <h3 style={{marginTop: 0, fontSize: '1.15rem', color: '#1e293b', marginBottom: 20}}>Como foi feito o pagamento?</h3>
        
        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCaixa} onChange={e => setUsaCaixa(e.target.checked)}/> Dinheiro retirado do Caixa
          </label>
          {usaCaixa && <input type="number" step="0.01" className="mcad-input" style={{width: 180}} value={valCaixa} onChange={e => setValCaixa(e.target.value)} placeholder="R$ 0,00"/>}
        </div>

        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCofre} onChange={e => setUsaCofre(e.target.checked)}/> Dinheiro retirado do Cofre
          </label>
          {usaCofre && <input type="number" step="0.01" className="mcad-input" style={{width: 180}} value={valCofre} onChange={e => setValCofre(e.target.value)} placeholder="R$ 0,00"/>}
        </div>

        <div className="mcad-split-item" style={{border: 'none'}}>
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaBoleto} onChange={e => setUsaBoleto(e.target.checked)}/> Faturado / Boleto a Prazo
          </label>
          {usaBoleto && <input type="number" step="0.01" className="mcad-input" style={{width: 180}} value={valBoleto} onChange={e => setValBoleto(e.target.value)} placeholder="R$ 0,00"/>}
        </div>

        {usaBoleto && (
          <div className="mcad-boleto-config">
            <div className="mcad-group">
              <label>Número de Parcelas</label>
              <input type="number" min="1" className="mcad-input" value={parcelas} onChange={e => setParcelas(e.target.value)} />
            </div>
            <div className="mcad-group">
              <label>Data do 1º Vencimento</label>
              <input type="date" className="mcad-input" value={vencimento} onChange={e => setVencimento(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="mcad-footer">
        <div style={{fontWeight: 700, fontSize: '1.1rem', color: restante === 0 ? '#16a34a' : '#ef4444'}}>
          {numTotal === 0 ? 'Informe o valor da nota' : restante === 0 ? '✔️ Divisão de valores exata' : `Falta alocar: ${formatCurrency(restante)}`}
        </div>
        <button 
          className="mcad-btn-salvar" 
          disabled={!isFormValid || isSubmitting} 
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Salvando...' : 'Finalizar Registro'}
        </button>
      </div>
    </div>
  );
}