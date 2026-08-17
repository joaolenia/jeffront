import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Mercadoria, Parcela } from './types';
import './MercadoriaCadastro.css';

interface Props {
  onSalvar: (m: Mercadoria) => void;
  onCancelar: () => void;
}

export function MercadoriaCadastro({ onSalvar, onCancelar }: Props) {
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
  const isFormValid = numTotal > 0 && restante === 0 && fornecedor.trim() !== '';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleSubmit = () => {
    const parcelasArray: Parcela[] = [];
    if (usaBoleto && numBoleto > 0) {
      const qtd = parseInt(parcelas) || 1;
      const valorPorParcela = numBoleto / qtd;
      
      let dataBase = vencimento ? new Date(vencimento) : new Date();
      
      for (let i = 1; i <= qtd; i++) {
        // Incrementa 30 dias para cada parcela (lógica simplificada)
        const dataVenc = new Date(dataBase);
        dataVenc.setDate(dataVenc.getDate() + ((i - 1) * 30));
        
        parcelasArray.push({
          numero: i,
          valor: valorPorParcela,
          vencimento: dataVenc.toLocaleDateString('pt-BR'),
          status: 'pendente'
        });
      }
    }

    onSalvar({
      id: Date.now(),
      fornecedor,
      data: new Date().toLocaleDateString('pt-BR'),
      valorTotal: numTotal,
      status: (usaBoleto && numBoleto > 0) ? 'pendente' : 'paga',
      pagamento: { caixa: numCaixa, cofre: numCofre, boleto: numBoleto },
      parcelasBoleto: parcelasArray
    });
  };

  return (
    <div className="mcad-container">
      <div className="mcad-header">
        <button onClick={onCancelar} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
          <ArrowLeft size={28} color="#64748b" />
        </button>
        <h2 style={{margin: 0, fontSize: '1.8rem', color: '#0f172a'}}>Registrar Mercadoria</h2>
      </div>

      <div className="mcad-row">
        <div className="mcad-group">
          <label>Nome do Fornecedor</label>
          <input className="mcad-input" value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: Coca-Cola, Ambev..." autoFocus />
        </div>
        <div className="mcad-group">
          <label>Valor Total da Nota (R$)</label>
          <input type="number" step="0.01" className="mcad-input" value={valorTotal} onChange={e => setValorTotal(e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div className="mcad-split-box">
        <h3 style={{marginTop: 0, fontSize: '1.15rem', color: '#1e293b', marginBottom: 20}}>Como foi feito o pagamento?</h3>
        
        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCaixa} onChange={e => setUsaCaixa(e.target.checked)}/> Dinheiro retirado do Caixa
          </label>
          {usaCaixa && <input type="number" className="mcad-input" style={{width: 180}} value={valCaixa} onChange={e => setValCaixa(e.target.value)} placeholder="R$ 0,00"/>}
        </div>

        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCofre} onChange={e => setUsaCofre(e.target.checked)}/> Dinheiro retirado do Cofre
          </label>
          {usaCofre && <input type="number" className="mcad-input" style={{width: 180}} value={valCofre} onChange={e => setValCofre(e.target.value)} placeholder="R$ 0,00"/>}
        </div>

        <div className="mcad-split-item" style={{border: 'none'}}>
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaBoleto} onChange={e => setUsaBoleto(e.target.checked)}/> Faturado / Boleto a Prazo
          </label>
          {usaBoleto && <input type="number" className="mcad-input" style={{width: 180}} value={valBoleto} onChange={e => setValBoleto(e.target.value)} placeholder="R$ 0,00"/>}
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
        <button className="mcad-btn-salvar" disabled={!isFormValid} onClick={handleSubmit}>
          Finalizar Registro
        </button>
      </div>
    </div>
  );
}