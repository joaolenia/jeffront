import React, { useState } from 'react';
import { PlusCircle, MinusCircle, ArrowDownCircle, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import './Patrimonio.css';

interface Movimentacao {
  id: string;
  tipo: 'entrada' | 'saida' | 'sangria';
  valor: number;
  descricao: string;
  data: Date;
}

export function Patrimonio() {
  const [saldo, setSaldo] = useState<number>(0);
  const [historico, setHistorico] = useState<Movimentacao[]>([]);
  const [acaoAtiva, setAcaoAtiva] = useState<'inserir' | 'tirar' | 'sangrar' | null>(null);
  
  const [valorInput, setValorInput] = useState<string>('');
  const [descricaoInput, setDescricaoInput] = useState<string>('');

  const formatarMoeda = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleMovimentacao = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valorInput.replace(',', '.'));
    
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Por favor, insira um valor válido.');
      return;
    }

    if (acaoAtiva === 'tirar' && valorNum > saldo) {
      alert('Saldo insuficiente para esta retirada.');
      return;
    }

    const novaMovimentacao: Movimentacao = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: acaoAtiva === 'tirar' ? 'saida' : (acaoAtiva === 'sangrar' ? 'sangria' : 'entrada'),
      valor: valorNum,
      descricao: descricaoInput || (acaoAtiva === 'sangrar' ? 'Sangria do Cofre' : 'Sem descrição'),
      data: new Date(),
    };

    setHistorico([novaMovimentacao, ...historico]);
    setSaldo(prev => acaoAtiva === 'tirar' ? prev - valorNum : prev + valorNum);
    
    // Resetar estado
    setAcaoAtiva(null);
    setValorInput('');
    setDescricaoInput('');
  };

  return (
    <div className="patrimonio-container">
      <header className="patrimonio-header">
        <div className="saldo-card">
          <Wallet size={32} className="saldo-icon" />
          <div>
            <h2>Patrimônio Total</h2>
            <p className="saldo-valor">{formatarMoeda(saldo)}</p>
          </div>
        </div>
      </header>

      <div className="acoes-grid">
        <button className="btn-acao btn-inserir" onClick={() => setAcaoAtiva('inserir')}>
          <PlusCircle size={20} />
          Inserir Dinheiro
        </button>
        <button className="btn-acao btn-tirar" onClick={() => setAcaoAtiva('tirar')}>
          <MinusCircle size={20} />
          Tirar Dinheiro
        </button>
        <button className="btn-acao btn-sangrar" onClick={() => setAcaoAtiva('sangrar')}>
          <ArrowDownCircle size={20} />
          Sangrar Cofre
        </button>
      </div>

      {acaoAtiva && (
        <form className="formulario-movimentacao" onSubmit={handleMovimentacao}>
          <h3>
            {acaoAtiva === 'inserir' && 'Inserir Dinheiro'}
            {acaoAtiva === 'tirar' && 'Retirar Dinheiro'}
            {acaoAtiva === 'sangrar' && 'Sangrar Cofre para Patrimônio'}
          </h3>
          
          <div className="input-group">
            <label>Valor (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01" 
              value={valorInput} 
              onChange={(e) => setValorInput(e.target.value)} 
              required 
              placeholder="0,00"
            />
          </div>

          <div className="input-group">
            <label>Descrição</label>
            <input 
              type="text" 
              value={descricaoInput} 
              onChange={(e) => setDescricaoInput(e.target.value)} 
              required={acaoAtiva !== 'sangrar'} 
              placeholder="Ex: Rendimentos, Venda de ativo..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={() => setAcaoAtiva(null)}>Cancelar</button>
            <button type="submit" className="btn-confirmar">Confirmar</button>
          </div>
        </form>
      )}

      <section className="historico-section">
        <h3>Histórico de Movimentações</h3>
        {historico.length === 0 ? (
          <p className="historico-vazio">Nenhuma movimentação registrada.</p>
        ) : (
          <ul className="historico-lista">
            {historico.map((mov) => (
              <li key={mov.id} className={`historico-item ${mov.tipo}`}>
                <div className="historico-info">
                  {mov.tipo === 'saida' ? <ArrowDownRight className="icon-saida" /> : <ArrowUpRight className="icon-entrada" />}
                  <div>
                    <strong>{mov.descricao}</strong>
                    <span>{mov.data.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div className="historico-valor">
                  {mov.tipo === 'saida' ? '-' : '+'}{formatarMoeda(mov.valor)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}