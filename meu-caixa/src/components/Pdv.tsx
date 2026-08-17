import React, { useState, useEffect } from 'react';
import { ShoppingCart, Printer, CheckCircle, Search, Trash2 } from 'lucide-react';
import { CupomFiscal } from './CupomFiscal'; // Ajuste o caminho conforme sua estrutura
import './Pdv.css';

export function Pdv() {
  const [itensCaixa, setItensCaixa] = useState([
    { id: 1, nome: 'Arroz 5kg', qtd: 1, preco: 25.90 },
    { id: 2, nome: 'Feijão 1kg', qtd: 2, preco: 8.50 },
  ]);

  const totalVenda = itensCaixa.reduce((acc, item) => acc + (item.qtd * item.preco), 0);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleFinalizar = () => {
    if (itensCaixa.length === 0) return;
    alert('Venda finalizada com sucesso!');
    setItensCaixa([]);
  };

  const handleImprimir = () => {
    if (itensCaixa.length === 0) {
      alert('Adicione itens antes de imprimir.');
      return;
    }
    window.print();
  };

  // Escuta os atalhos de teclado globalmente
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
  }, [itensCaixa]);

  return (
    <div className="pdv-container">
      {/* Componente oculto para impressão */}
      <CupomFiscal itens={itensCaixa} total={totalVenda} />

      {/* Interface Visível do PDV */}
      <div className="pdv-layout hide-on-print">
        {/* Lado Esquerdo: Lista de Produtos */}
        <div className="pdv-left-panel">
          <div className="search-bar">
            <Search className="search-icon" size={20} />
            <input type="text" placeholder="Código de barras ou nome do produto..." autoFocus />
          </div>

          <div className="cart-list">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Descrição</th>
                  <th>Qtd</th>
                  <th>Valor Unit.</th>
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
                      <button className="btn-icon-danger">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lado Direito: Resumo e Ações */}
        <div className="pdv-right-panel">
          <div className="summary-card">
            <h2>Total da Venda</h2>
            <div className="total-display">
              {formatCurrency(totalVenda)}
            </div>

            <div className="shortcuts-info">
              <p><span>F2</span> Finalizar Venda</p>
              <p><span>F4</span> Imprimir Cupom</p>
              <p><span>F9</span> Cancelar Item</p>
            </div>

            <div className="action-buttons">
              <button className="btn-action btn-success" onClick={handleFinalizar}>
                <CheckCircle size={24} />
                Finalizar Venda (F2)
              </button>
              <button className="btn-action btn-primary" onClick={handleImprimir}>
                <Printer size={24} />
                Imprimir Cupom (F4)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}