import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import './Fichas.css';

// Simulando dados de vendas fiadas de um cliente
const VENDAS_MOCK = [
  { id: 101, data: '10/08/2026', descricao: 'Pão, Leite, Manteiga', valor: 25.50 },
  { id: 102, data: '12/08/2026', descricao: 'Carne, Refrigerante', valor: 75.00 },
  { id: 103, data: '15/08/2026', descricao: 'Arroz, Feijão', valor: 50.00 },
];

interface FichaDetalhesProps {
  fichaId: number;
  onVoltar: () => void;
}

export function FichaDetalhes({ fichaId, onVoltar }: FichaDetalhesProps) {
  // Na prática, você buscaria os dados do cliente usando o 'fichaId'
  const nomeCliente = "João Silva"; 
  const totalDevidoOriginal = 150.50;

  const [tipoPagamento, setTipoPagamento] = useState<'integral' | 'parcial'>('integral');
  const [valorParcial, setValorParcial] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handlePagar = () => {
    let valorPago = totalDevidoOriginal;
    
    if (tipoPagamento === 'parcial') {
      valorPago = parseFloat(valorParcial.replace(',', '.'));
      if (isNaN(valorPago) || valorPago <= 0 || valorPago > totalDevidoOriginal) {
        alert('Informe um valor parcial válido (maior que 0 e menor/igual à dívida).');
        return;
      }
    }

    alert(`Pagamento de ${formatCurrency(valorPago)} via ${formaPagamento} registrado com sucesso para ${nomeCliente}!`);
    onVoltar(); // Volta pra lista após pagar
  };

  return (
    <div className="fichas-container">
      <div className="detalhes-header">
        <button className="btn-voltar" onClick={onVoltar}>
          <ArrowLeft size={20} /> Voltar
        </button>
        <h2>Ficha de: <span>{nomeCliente}</span></h2>
      </div>

      <div className="detalhes-layout">
        {/* Painel Esquerdo: Histórico de Vendas */}
        <div className="vendas-list">
          <h3>Histórico de Compras Não Pagas</h3>
          <table className="modern-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição (Resumo)</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {VENDAS_MOCK.map(venda => (
                <tr key={venda.id}>
                  <td>{venda.data}</td>
                  <td>{venda.descricao}</td>
                  <td style={{ fontWeight: 'bold' }}>{formatCurrency(venda.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Painel Direito: Ações de Pagamento */}
        <div className="pagamento-panel">
          <h3>Acerto de Conta</h3>
          
          <div className="total-divida">
            {formatCurrency(totalDevidoOriginal)}
          </div>

          <div className="tipo-pagamento">
            <button 
              className={`btn-tipo ${tipoPagamento === 'integral' ? 'active' : ''}`}
              onClick={() => setTipoPagamento('integral')}
            >
              Valor Integral
            </button>
            <button 
              className={`btn-tipo ${tipoPagamento === 'parcial' ? 'active' : ''}`}
              onClick={() => {
                setTipoPagamento('parcial');
                setValorParcial(''); // Limpa o input se mudar pra parcial
              }}
            >
              Valor Parcial
            </button>
          </div>

          {tipoPagamento === 'parcial' && (
            <div className="valor-input">
              <label>Valor a abater (R$)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="Ex: 50.00" 
                value={valorParcial}
                onChange={(e) => setValorParcial(e.target.value)}
                autoFocus
              />
            </div>
          )}

          <div className="payment-methods" style={{ marginTop: '8px' }}>
            <button 
              className={`btn-pay ${formaPagamento === 'Dinheiro' ? 'active' : ''}`}
              onClick={() => setFormaPagamento('Dinheiro')}
            ><DollarSign size={18}/> Dinheiro</button>
            <button 
              className={`btn-pay ${formaPagamento === 'Cartão' ? 'active' : ''}`}
              onClick={() => setFormaPagamento('Cartão')}
            ><CreditCard size={18}/> Cartão</button>
            <button 
              className={`btn-pay ${formaPagamento === 'Pix' ? 'active' : ''}`}
              onClick={() => setFormaPagamento('Pix')}
            >Pix</button>
          </div>

          <button className="btn-confirmar-pgto" onClick={handlePagar}>
            <CheckCircle size={24} />
            Confirmar Recebimento
          </button>
        </div>
      </div>
    </div>
  );
}