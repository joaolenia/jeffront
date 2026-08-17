import React, { useState, useRef, type KeyboardEvent } from 'react';
import { ShoppingCart, Printer, Trash2, DollarSign, CreditCard } from 'lucide-react';
import './Pdv.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export const Pdv: React.FC = () => {
  // Estados de entrada do produto
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productQty, setProductQty] = useState('1');

  // Estados do carrinho e pagamento
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountPaid, setAmountPaid] = useState('');

  // Refs para focar no input após adicionar
  const priceInputRef = useRef<HTMLInputElement>(null);

  const handleAddItem = () => {
    const priceStr = productPrice.replace(',', '.');
    const price = parseFloat(priceStr);
    const qty = parseInt(productQty) || 1;

    if (isNaN(price) || price <= 0) {
      alert('Por favor, insira um valor válido.');
      priceInputRef.current?.focus();
      return;
    }

    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: productName.trim() || 'Produto Diversos',
      price: price,
      quantity: qty,
      total: price * qty,
    };

    setCart([...cart, newItem]);
    
    // Limpar campos
    setProductName('');
    setProductPrice('');
    setProductQty('1');
    priceInputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    }
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalCart = cart.reduce((acc, item) => acc + item.total, 0);
  
  const paid = parseFloat(amountPaid.replace(',', '.')) || 0;
  const change = paymentMethod === 'Dinheiro' ? (paid - totalCart) : 0;

  const handlePrint = () => {
    if (cart.length === 0) {
      alert('O carrinho está vazio.');
      return;
    }
    window.print();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="pdv-container">
      {/* ===== TELA DO SISTEMA (NÃO IMPRIME) ===== */}
      <div className="pdv-interface">
        {/* Lado Esquerdo: Lançamento e Lista */}
        <div className="pdv-left">
          <header className="pdv-header">
            <ShoppingCart className="icon" />
            <h1>Caixa Aberto</h1>
          </header>

          <div className="input-section">
            <div className="input-group">
              <label>Nome do Produto (Opcional)</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Arroz 5kg"
              />
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Valor (R$)*</label>
                <input
                  ref={priceInputRef}
                  type="number"
                  step="0.01"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="input-group">
                <label>Qtd</label>
                <input
                  type="number"
                  value={productQty}
                  onChange={(e) => setProductQty(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min="1"
                />
              </div>
              <button className="btn-add" onClick={handleAddItem}>
                Inserir (Enter)
              </button>
            </div>
          </div>

          <div className="cart-list">
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd</th>
                  <th>Valor Un.</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td><strong>{formatCurrency(item.total)}</strong></td>
                    <td>
                      <button className="btn-remove" onClick={() => removeItem(item.id)}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-cart">Nenhum produto adicionado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lado Direito: Resumo e Pagamento */}
        <div className="pdv-right">
          <div className="summary-card">
            <h2>Resumo da Venda</h2>
            <div className="total-display">
              <span>Total:</span>
              <span className="total-value">{formatCurrency(totalCart)}</span>
            </div>

            <div className="payment-section">
              <label>Forma de Pagamento</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Pix">PIX</option>
              </select>

              {paymentMethod === 'Dinheiro' && (
                <div className="cash-calc">
                  <div className="input-group">
                    <label>Valor Recebido (R$)</label>
                    <div className="input-icon">
                      <DollarSign size={18} />
                      <input
                        type="number"
                        step="0.01"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                  
                  <div className={`change-display ${change < 0 ? 'error' : ''}`}>
                    <span>Troco:</span>
                    <span>{change >= 0 ? formatCurrency(change) : 'Valor insuficiente'}</span>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-print" onClick={handlePrint} disabled={cart.length === 0}>
              <Printer size={20} />
              Finalizar e Imprimir Nota
            </button>
          </div>
        </div>
      </div>

      {/* ===== ÁREA DE IMPRESSÃO (CUPOM 80MM) ===== */}
      <div className="print-area">
        <div className="receipt">
          <div className="receipt-header">
            <h3>Mercado Bom Jesus</h3>
            <p>Av. Ver. Venceslau Gaias, 705 - Santana</p>
            <p>Cruz Machado - PR, 84620-000</p>
            <p>CNPJ: 35.041.960/0001-84</p>
            <p className="subtitle">*** RECIBO SEM VALOR FISCAL ***</p>
            <p>Data: {new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div className="receipt-divider"></div>

          <table className="receipt-items">
            <thead>
              <tr>
                <th className="text-left">Qtd</th>
                <th className="text-left">Produto</th>
                <th className="text-right">Vl. Un</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.quantity}</td>
                  <td>{item.name}</td>
                  <td className="text-right">{item.price.toFixed(2)}</td>
                  <td className="text-right">{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-divider"></div>

          <div className="receipt-totals">
            <div className="row">
              <span>Total a Pagar:</span>
              <strong>{formatCurrency(totalCart)}</strong>
            </div>
            <div className="row">
              <span>Forma de Pgto:</span>
              <span>{paymentMethod}</span>
            </div>
            {paymentMethod === 'Dinheiro' && (
              <>
                <div className="row">
                  <span>Valor Recebido:</span>
                  <span>{formatCurrency(paid)}</span>
                </div>
                <div className="row">
                  <span>Troco:</span>
                  <span>{formatCurrency(change > 0 ? change : 0)}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="receipt-footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte Sempre</p>
          </div>
        </div>
      </div>
    </div>
  );
};