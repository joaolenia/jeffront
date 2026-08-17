import React, { useState, useEffect, useRef } from 'react';
import { Printer, CheckCircle, Trash2, Plus, DollarSign, CreditCard } from 'lucide-react';
import { CupomFiscal } from './CupomFiscal';
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
    precoInputRef.current?.focus(); // Mantém o foco no preço para facilitar lançamentos rápidos
  };

  const handleRemoverItem = (id: number) => {
    setItensCaixa(itensCaixa.filter(item => item.id !== id));
  };

  const handleFinalizar = () => {
    if (itensCaixa.length === 0) return;
    if (formaPagamento === 'Dinheiro' && valorRecebidoNum < totalVenda) {
      alert('Valor recebido é menor que o total.');
      return;
    }
    alert('Venda finalizada!');
    setItensCaixa([]);
    setValorRecebido('');
    setFormaPagamento('Dinheiro');
  };

  const handleImprimir = () => {
    if (itensCaixa.length === 0) return;
    window.print();
  };

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        handleFinalizar();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleImprimir();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itensCaixa, formaPagamento, valorRecebido, totalVenda]);

  return (
    <div className="pdv-container">
      {/* Bobina de Impressão (Oculta na tela) */}
      <CupomFiscal 
        itens={itensCaixa} 
        total={totalVenda} 
        formaPagamento={formaPagamento}
        valorRecebido={valorRecebidoNum}
        troco={troco}
      />

      {/* Interface do PDV */}
      <div className="pdv-layout hide-on-print">
        
        {/* Lado Esquerdo */}
        <div className="pdv-left-panel">
          {/* Lançamento Manual de Produto */}
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

          {/* Lista de Itens */}
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

        {/* Lado Direito */}
        <div className="pdv-right-panel">
          <div className="summary-card">
            <h2>Total da Venda</h2>
            <div className="total-display">{formatCurrency(totalVenda)}</div>

            {/* Formas de Pagamento */}
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

            <div className="shortcuts-info">
              <p><span>F2</span> Finalizar Venda</p>
              <p><span>F4</span> Imprimir Cupom</p>
            </div>

            <div className="action-buttons">
              <button className="btn-action btn-success" onClick={handleFinalizar}>
                <CheckCircle size={24} /> Finalizar (F2)
              </button>
              <button className="btn-action btn-primary" onClick={handleImprimir}>
                <Printer size={24} /> Imprimir (F4)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}