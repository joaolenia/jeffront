import  { useState } from 'react';
import { ArrowLeft, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import './FichaDetalhes.css';

const VENDAS_MOCK = [
  { id: 101, data: '10/08/2026', descricao: 'Pão, Leite, Manteiga', valor: 25.50 },
  { id: 102, data: '12/08/2026', descricao: 'Carne, Refrigerante', valor: 75.00 },
  { id: 103, data: '15/08/2026', descricao: 'Arroz, Feijão', valor: 50.00 },
];

interface FichaDetalhesProps {
  fichaId: number;
  onVoltar: () => void;
}

export function FichaDetalhes({  onVoltar }: FichaDetalhesProps) {
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
        alert('Informe um valor válido e menor ou igual ao total da dívida.');
        return;
      }
    }

    alert(`Sucesso! Pagamento de ${formatCurrency(valorPago)} via ${formaPagamento} registrado para ${nomeCliente}.`);
    onVoltar();
  };

  return (
    <div className="ficha-detalhes-container">
      <div className="ficha-detalhes-header">
        <button className="ficha-detalhes-btn-voltar" onClick={onVoltar}>
          <ArrowLeft size={20} /> Voltar
        </button>
        <h2 className="ficha-detalhes-title">
          Acerto de Conta: <span>{nomeCliente}</span>
        </h2>
      </div>

      <div className="ficha-detalhes-layout">
        {/* Painel Esquerdo: Lista de vendas */}
        <div className="ficha-detalhes-historico">
          <h3>Histórico de Compras em Aberto</h3>
          <table className="ficha-detalhes-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Resumo dos Itens</th>
                <th className="align-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {VENDAS_MOCK.map(venda => (
                <tr key={venda.id}>
                  <td>{venda.data}</td>
                  <td>{venda.descricao}</td>
                  <td className="align-right bold-text">{formatCurrency(venda.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Painel Direito: Ações */}
        <div className="ficha-detalhes-pagamento">
          <h3>Detalhes do Pagamento</h3>
          
          <div className="ficha-detalhes-total">
            <p>Dívida Total</p>
            {formatCurrency(totalDevidoOriginal)}
          </div>

          <div className="ficha-detalhes-tipo-pgto">
            <button 
              className={`ficha-detalhes-btn-tipo ${tipoPagamento === 'integral' ? 'active' : ''}`}
              onClick={() => setTipoPagamento('integral')}
            >
              Valor Integral
            </button>
            <button 
              className={`ficha-detalhes-btn-tipo ${tipoPagamento === 'parcial' ? 'active' : ''}`}
              onClick={() => {
                setTipoPagamento('parcial');
                setValorParcial('');
              }}
            >
              Valor Parcial
            </button>
          </div>

          {tipoPagamento === 'parcial' && (
            <div className="ficha-detalhes-input-group">
              <label>Valor que será pago agora (R$)</label>
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

          <div className="ficha-detalhes-metodos-container">
            <label>Forma de Recebimento</label>
            <div className="ficha-detalhes-metodos">
              <button 
                className={`ficha-detalhes-btn-metodo ${formaPagamento === 'Dinheiro' ? 'active' : ''}`}
                onClick={() => setFormaPagamento('Dinheiro')}
              ><DollarSign size={18}/> Dinheiro</button>
              <button 
                className={`ficha-detalhes-btn-metodo ${formaPagamento === 'Cartão' ? 'active' : ''}`}
                onClick={() => setFormaPagamento('Cartão')}
              ><CreditCard size={18}/> Cartão</button>
              <button 
                className={`ficha-detalhes-btn-metodo ${formaPagamento === 'Pix' ? 'active' : ''}`}
                onClick={() => setFormaPagamento('Pix')}
              >Pix</button>
            </div>
          </div>

          <button className="ficha-detalhes-btn-confirmar" onClick={handlePagar}>
            <CheckCircle size={22} /> Confirmar Pagamento
          </button>
        </div>
      </div>
    </div>
  );
}