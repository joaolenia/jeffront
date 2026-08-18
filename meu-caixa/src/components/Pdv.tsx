import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Trash2, Plus, DollarSign, CreditCard } from 'lucide-react';
import { CupomFiscal } from './CupomFiscal';
import api from '../api';
import './Pdv.css';

interface ItemCaixa {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

export function Pdv() {
  const [itensCaixa, setItensCaixa] = useState<ItemCaixa[]>([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [preco, setPreco] = useState('');
  const [qtd, setQtd] = useState('1');
  
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [loading, setLoading] = useState(false);

  const precoInputRef = useRef<HTMLInputElement>(null);

  const totalVenda = itensCaixa.reduce((acc, item) => acc + (item.qtd * item.preco), 0);
  const valorRecebidoNum = parseFloat(valorRecebido.replace(',', '.')) || 0;
  const troco = formaPagamento === 'Dinheiro' && valorRecebidoNum > totalVenda 
    ? valorRecebidoNum - totalVenda 
    : 0;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleAdicionarItem = (e?: React.FormEvent) => {
    e?.preventDefault();
    const precoNum = parseFloat(preco.replace(',', '.'));
    const qtdNum = parseInt(qtd, 10);

    if (isNaN(precoNum) || precoNum <= 0) {
      alert('Informe um valor válido.');
      precoInputRef.current?.focus();
      return;
    }

    const novoItem = {
      id: Date.now(),
      nome: nomeProduto.trim() || 'Diversos',
      preco: precoNum,
      qtd: isNaN(qtdNum) || qtdNum <= 0 ? 1 : qtdNum
    };

    setItensCaixa([...itensCaixa, novoItem]);
    setNomeProduto('');
    setPreco('');
    setQtd('1');
    precoInputRef.current?.focus();
  };

  const handleRemoverItem = (id: number) => {
    setItensCaixa(itensCaixa.filter(item => item.id !== id));
  };

  const handleFinalizar = async () => {
    if (itensCaixa.length === 0) return;
    if (formaPagamento === 'Dinheiro' && valorRecebidoNum < totalVenda) {
      alert('Valor recebido é menor que o total.');
      return;
    }
    
    if (loading) return; // Previne múltiplos envios
    setLoading(true);

    const payload = {
      itens: itensCaixa,
      total: totalVenda,
      valorRecebido: valorRecebidoNum,
      troco: troco,
      formaPagamento: formaPagamento
    };

    try {
      const response = await api.post('/vendas', payload);
      
      if (response.status === 201) {
        // Abre a tela de impressão ANTES de limpar os dados da tela
        window.print();
        
        // Limpa a tela após a impressão
        alert('Venda finalizada com sucesso!');
        setItensCaixa([]);
        setValorRecebido('');
        setFormaPagamento('Dinheiro');
      }
    } catch (error) {
      console.error('Erro ao salvar a venda:', error);
      alert('Ocorreu um erro ao finalizar a venda. Verifique o console ou conexão com a API.');
    } finally {
      setLoading(false);
    }
  };

  // Escuta o atalho de teclado F2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleFinalizar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itensCaixa, formaPagamento, valorRecebido, totalVenda, loading]);

  return (
    <div className="pdv-container">
      <CupomFiscal 
        itens={itensCaixa} 
        total={totalVenda} 
        formaPagamento={formaPagamento}
        valorRecebido={valorRecebidoNum}
        troco={troco}
      />

      <div className="pdv-layout hide-on-print">
        
        <div className="pdv-left-panel">
          <form className="add-item-form" onSubmit={handleAdicionarItem}>
            <div className="input-group" style={{ flex: 2 }}>
              <label>Produto (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ex: Pão Francês" 
                value={nomeProduto} 
                onChange={(e) => setNomeProduto(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <label>Qtd.</label>
              <input 
                type="number" 
                min="1"
                value={qtd} 
                onChange={(e) => setQtd(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <label>Valor (R$)</label>
              <input 
                ref={precoInputRef}
                type="number" 
                step="0.01"
                min="0.01"
                placeholder="0,00" 
                value={preco} 
                onChange={(e) => setPreco(e.target.value)} 
                autoFocus
                required
              />
            </div>
            <button type="submit" className="btn-add">
              <Plus size={24} />
            </button>
          </form>

          <div className="cart-list">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>V. Unit.</th>
                  <th>Subtotal</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensCaixa.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.nome}</td>
                    <td>{item.qtd}</td>
                    <td>{formatCurrency(item.preco)}</td>
                    <td>{formatCurrency(item.qtd * item.preco)}</td>
                    <td>
                      <button className="btn-icon-danger" onClick={() => handleRemoverItem(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pdv-right-panel">
          <div className="summary-card">
            <h2>Total da Venda</h2>
            <div className="total-display">{formatCurrency(totalVenda)}</div>

            <div className="payment-section">
              <h3>Forma de Pagamento</h3>
              <div className="payment-methods">
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

              {formaPagamento === 'Dinheiro' && (
                <div className="cash-inputs">
                  <div className="input-group">
                    <label>Valor Recebido (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={valorRecebido}
                      onChange={(e) => setValorRecebido(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="change-display">
                    Troco: <span>{formatCurrency(troco)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="action-buttons">
              {/* Botão único e direto, sem o bloco separado de atalhos e sem o botão isolado de imprimir */}
              <button 
                className="btn-action btn-success" 
                onClick={handleFinalizar}
                disabled={loading || itensCaixa.length === 0}
              >
                <CheckCircle size={24} /> 
                {loading ? 'Processando...' : 'Finalizar Venda [F2]'}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}