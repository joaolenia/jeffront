import React from 'react';

interface Item {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

interface CupomFiscalProps {
  itens: Item[];
  total: number;
}

export function CupomFiscal({ itens, total }: CupomFiscalProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div id="print-section" className="cupom-container">
      <div className="cupom-header">
        <h2>MERCADO BOM JESUS</h2>
        <p>Av. Ver. Venceslau Gaias, 705</p>
        <p>Santana, Cruz Machado - PR</p>
        <p>CEP: 84620-000</p>
        <p>CNPJ: 35.041.960/0001-84</p>
        <hr className="dashed-line" />
        <h3>CUPOM NÃO FISCAL</h3>
        <hr className="dashed-line" />
      </div>

      <table className="cupom-table">
        <thead>
          <tr>
            <th>QTD</th>
            <th>DESCRIÇÃO</th>
            <th>V. UN</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td>{item.qtd}</td>
              <td>{item.nome}</td>
              <td>{formatCurrency(item.preco)}</td>
              <td>{formatCurrency(item.qtd * item.preco)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cupom-footer">
        <hr className="dashed-line" />
        <div className="total-row">
          <span>TOTAL R$</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <hr className="dashed-line" />
        <p>Obrigado pela preferência!</p>
        <p>Volte Sempre</p>
      </div>
    </div>
  );
}