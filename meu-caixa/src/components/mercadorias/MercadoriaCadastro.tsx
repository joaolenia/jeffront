
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Mercadoria, Parcela } from './types';
import './MercadoriaCadastro.css';

interface MercadoriaCadastroProps {
  onSalvar: (mercadoria: Mercadoria) => void;
  onCancelar: () => void;
}

export function MercadoriaCadastro({ onSalvar, onCancelar }: MercadoriaCadastroProps) {
  const [fornecedor, setFornecedor] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  
  const [usaCaixa, setUsaCaixa] = useState(false);
  const [valCaixa, setValCaixa] = useState('');
  const [usaCofre, setUsaCofre] = useState(false);
  const [valCofre, setValCofre] = useState('');
  const [usaBoleto, setUsaBoleto] = useState(false);
  const [valBoleto, setValBoleto] = useState('');
  
  const [parcelas, setParcelas] = useState('1');
  const [vencimento, setVencimento] = useState('');

  const numTotal = parseFloat(valorTotal) || 0;
  const numCaixa = usaCaixa ? (parseFloat(valCaixa) || 0) : 0;
  const numCofre = usaCofre ? (parseFloat(valCofre) || 0) : 0;
  const numBoleto = usaBoleto ? (parseFloat(valBoleto) || 0) : 0;
  
  const restante = numTotal - (numCaixa + numCofre + numBoleto);
  const canSave = numTotal > 0 && restante === 0 && fornecedor.trim() !== '';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSave = () => {
    const parcelasArray: Parcela[] = [];
    if (usaBoleto && numBoleto > 0) {
      const qtd = parseInt(parcelas);
      const valorParcela = numBoleto / qtd;
      for (let i = 1; i <= qtd; i++) {
        parcelasArray.push({
          numero: i,
          valor: valorParcela,
          vencimento: i === 1 ? vencimento : `+${i * 30} dias`, // Simplificação para o exemplo
          status: 'pendente'
        });
      }
    }

    onSalvar({
      id: Date.now(),
      fornecedor,
      data: new Date().toLocaleDateString('pt-BR'),
      valorTotal: numTotal,
      status: usaBoleto && numBoleto > 0 ? 'pendente' : 'paga',
      pagamento: { caixa: numCaixa, cofre: numCofre, boleto: numBoleto },
      parcelasBoleto: parcelasArray
    });
  };

  return (
    <div className="mcad-container">
      <div className="mcad-header">
        <button onClick={onCancelar} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
          <ArrowLeft size={24} color="#475569" />
        </button>
        <h2 style={{margin: 0, color: '#0f172a'}}>Cadastrar Nova Mercadoria</h2>
      </div>

      <div className="mcad-row">
        <div className="mcad-group">
          <label>Fornecedor</label>
          <input className="mcad-input" value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: Bebidas S/A" />
        </div>
        <div className="mcad-group">
          <label>Valor Total da Nota (R$)</label>
          <input type="number" className="mcad-input" value={valorTotal} onChange={e => setValorTotal(e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div className="mcad-split-box">
        <h3 style={{marginTop: 0, fontSize: '1.05rem', color: '#1e293b'}}>Forma de Pagamento</h3>
        
        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCaixa} onChange={e => setUsaCaixa(e.target.checked)}/> Tirar do Caixa
          </label>
          {usaCaixa && <input type="number" className="mcad-input" style={{width: 150}} value={valCaixa} onChange={e => setValCaixa(e.target.value)} placeholder="Valor Caixa"/>}
        </div>

        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCofre} onChange={e => setUsaCofre(e.target.checked)}/> Tirar do Cofre
          </label>
          {usaCofre && <input type="number" className="mcad-input" style={{width: 150}} value={valCofre} onChange={e => setValCofre(e.target.value)} placeholder="Valor Cofre"/>}
        </div>

        <div className="mcad-split-item" style={{border: 'none'}}>
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaBoleto} onChange={e => setUsaBoleto(e.target.checked)}/> Parcelar no Boleto
          </label>
          {usaBoleto && <input type="number" className="mcad-input" style={{width: 150}} value={valBoleto} onChange={e => setValBoleto(e.target.value)} placeholder="Valor Boleto"/>}
        </div>

        {usaBoleto && (
          <div className="mcad-boleto-config">
            <div className="mcad-group">
              <label>Qtd. Parcelas</label>
              <input type="number" min="1" className="mcad-input" value={parcelas} onChange={e => setParcelas(e.target.value)} />
            </div>
            <div className="mcad-group">
              <label>1º Vencimento</label>
              <input type="date" className="mcad-input" value={vencimento} onChange={e => setVencimento(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="mcad-footer">
        <div style={{fontWeight: 600, color: restante === 0 ? '#16a34a' : '#dc2626'}}>
          {numTotal === 0 ? 'Insira o valor' : restante === 0 ? 'Valores conferem!' : `Falta alocar: ${formatCurrency(restante)}`}
        </div>
        <button className="mcad-btn-salvar" disabled={!canSave} onClick={handleSave}>
          Confirmar Cadastro
        </button>
      </div>
    </div>
  );
}