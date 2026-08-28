import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Trash2, Plus, DollarSign, CreditCard, BookOpen, Loader2, ArrowRightLeft } from 'lucide-react';
import { CupomFiscal } from './CupomFiscal';
import api from '../api';
import './Pdv.css';
import { CrediarioForm } from './CrediarioForm';
import type { Ficha } from './CrediarioForm';

interface ItemCaixa {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

type FormaPagamento = 'Dinheiro' | 'Cartão' | 'Pix' | 'Crediário';

export function Pdv() {
  const [itensCaixa, setItensCaixa] = useState<ItemCaixa[]>([]);
  const [nomeProduto, setNomeProduto] = useState('');
  const [preco, setPreco] = useState('');
  const [qtd, setQtd] = useState('1');
  
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCrediarioModal, setShowCrediarioModal] = useState(false);

  // Estados da Sangria
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [valorSangria, setValorSangria] = useState('');
  const [sangriaLoading, setSangriaLoading] = useState(false);

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
    
    let inputVal = preco.trim();
    let precoNum = 0;
    let qtdNum = parseInt(qtd, 10);

    if (inputVal.includes('*')) {
      const parts = inputVal.split('*');
      const pStr = parts[0].replace(',', '.');
      const qStr = parts[1];
      
      precoNum = parseFloat(pStr);
      const parsedQtd = parseInt(qStr, 10);
      
      if (!isNaN(parsedQtd) && parsedQtd > 0) {
        qtdNum = parsedQtd;
      }
    } else {
      precoNum = parseFloat(inputVal.replace(',', '.'));
    }

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

  const handleFinalizarClick = async () => {
    if (itensCaixa.length === 0) return;
    
    if (formaPagamento === 'Dinheiro' && valorRecebidoNum < totalVenda) {
      alert('Valor recebido é menor que o total.');
      return;
    }
    
    if (formaPagamento === 'Crediário') {
      setShowCrediarioModal(true);
    } else {
      // Como a função de baixo agora tem 'await' e abre popup, precisamos chamar adequadamente
      await processarVenda(null);
    }
  };

  const processarVenda = async (fichaCrediario: Ficha | null) => {
    // === O SEGREDO ESTÁ NESTE AWAIT ===
    // Ele diz ao React para pausar esta função e esperar o usuário clicar em Confirmar/Cancelar no Modal.
    if (!await window.confirm('Tem certeza que deseja confirmar esta venda?')) {
      return;
    }

    if (loading) return; 
    setLoading(true);

    const isCrediario = formaPagamento === 'Crediário';

    const payloadVenda = {
      itens: itensCaixa,
      total: totalVenda,
      valorRecebido: isCrediario ? 0 : valorRecebidoNum,
      troco: isCrediario ? 0 : troco,
      formaPagamento: formaPagamento
    };

    try {
      const responseVenda = await api.post('/vendas', payloadVenda);

      if (isCrediario && fichaCrediario) {
        const resumoItens = itensCaixa.map(i => `${i.qtd}x ${i.nome}`).join(', ');
        
        const dataAtual = new Date();
        const dataLocal = new Date(dataAtual.getTime() - (dataAtual.getTimezoneOffset() * 60000));
        
        const novaCompra = {
          idVenda: responseVenda.data?.id || Date.now(),
          data: dataLocal.toISOString(),
          resumoItens: resumoItens,
          valor: totalVenda
        };

        await api.patch(`/fichas/${fichaCrediario.id}`, {
          valorTotal: Number(fichaCrediario.valorTotal) + totalVenda,
          compras: [...(fichaCrediario.compras || []), novaCompra]
        });

        setShowCrediarioModal(false);
      }

      if (responseVenda.status === 201 || responseVenda.status === 200) {
        window.print();
        
        alert(`Venda finalizada com sucesso! (${formaPagamento})`);
        setItensCaixa([]);
        setValorRecebido('');
        setFormaPagamento('Dinheiro');
      }
    } catch (error: any) {
      console.error('Erro ao salvar a venda:', error);
      
      if (error.response) {
        console.error('Dados do erro do servidor:', error.response.data);
        alert(`Erro do Servidor: ${error.response.data.message || 'Verifique o console.'}`);
      } else if (error.request) {
        console.error('Sem resposta do servidor.');
        alert('Erro de rede: O servidor não respondeu. A API está rodando corretamente?');
      } else {
        alert('Ocorreu um erro ao montar a requisição.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarSangria = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valorSangria.replace(',', '.'));
    
    if (isNaN(valorNum) || valorNum <= 0) {
      alert('Informe um valor válido para a sangria.');
      return;
    }

    const formatado = formatCurrency(valorNum);
    
    // === AQUI TAMBÉM PRECISOU DO AWAIT ===
    if (!await window.confirm(`Deseja realmente enviar ${formatado} para o cofre?`)) {
      return;
    }

    setSangriaLoading(true);

    try {
      await api.post('/cofre/movimentacao', {
        tipo: 'entrada',
        valor: valorNum,
        descricao: 'Sangria de caixa',
        origem: 'caixa'
      });
      
      alert(`Sangria de ${formatado} realizada com sucesso! O valor já consta no cofre.`);
      setShowSangriaModal(false);
      setValorSangria('');
    } catch (error: any) {
      console.error('Erro ao realizar sangria:', error);
      alert(error.response?.data?.message || 'Erro ao registrar sangria no cofre.');
    } finally {
      setSangriaLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && !showCrediarioModal && !showSangriaModal) {
        e.preventDefault();
        handleFinalizarClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itensCaixa, formaPagamento, valorRecebido, totalVenda, loading, showCrediarioModal, showSangriaModal]);

  return (
    <div className="pdv-container">
      <CupomFiscal 
        itens={itensCaixa} 
        total={totalVenda} 
        formaPagamento={formaPagamento}
        valorRecebido={formaPagamento === 'Crediário' ? 0 : valorRecebidoNum}
        troco={formaPagamento === 'Crediário' ? 0 : troco}
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
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Qtd.</label>
              <input 
                type="number" 
                min="1"
                value={qtd} 
                onChange={(e) => setQtd(e.target.value)} 
                disabled={loading}
              />
            </div>
            <div className="input-group">
              <label>Valor Unit. (R$) ou Val*Qtd</label>
              <input 
                ref={precoInputRef}
                type="text" 
                placeholder="Ex: 1,50 ou 1,50*12" 
                value={preco} 
                onChange={(e) => setPreco(e.target.value)} 
                autoFocus
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-add" disabled={loading} title="Adicionar">
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
                      <button className="btn-icon-danger" onClick={() => handleRemoverItem(item.id)} disabled={loading}>
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
                <button 
                  className={`btn-pay crediario-btn ${formaPagamento === 'Crediário' ? 'active' : ''}`}
                  onClick={() => setFormaPagamento('Crediário')}
                ><BookOpen size={18}/> Crediário</button>
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
              <button 
                className="btn-action btn-success" 
                onClick={handleFinalizarClick}
                disabled={loading || itensCaixa.length === 0}
              >
                {loading && !showCrediarioModal ? <Loader2 size={24} className="loading-spinner"/> : <CheckCircle size={24} />} 
                {loading && !showCrediarioModal ? 'Processando...' : 'Finalizar Venda [F2]'}
              </button>
              
              <button 
                className="btn-action btn-sangria" 
                onClick={() => setShowSangriaModal(true)}
                disabled={loading || itensCaixa.length > 0} 
                title={itensCaixa.length > 0 ? "Finalize a venda atual primeiro" : "Retirar dinheiro do caixa"}
              >
                <ArrowRightLeft size={20} />
                Sangria de Caixa
              </button>
            </div>
            
          </div>
        </div>
      </div>

      {showCrediarioModal && (
        <CrediarioForm
          totalVenda={totalVenda}
          onConfirm={processarVenda}
          onClose={() => setShowCrediarioModal(false)}
        />
      )}

      {showSangriaModal && (
        <div className="pdv-modal-overlay">
          <div className="pdv-modal">
            <div className="modal-header">
              <h2>Sangria de Caixa</h2>
            </div>
            <p className="modal-description">Retire o dinheiro do caixa e envie diretamente para o cofre da loja.</p>
            <form onSubmit={handleSalvarSangria}>
              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label>Valor da Sangria (R$)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0.01"
                  required 
                  autoFocus
                  placeholder="0,00"
                  value={valorSangria}
                  onChange={(e) => setValorSangria(e.target.value)}
                  disabled={sangriaLoading}
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancelar" 
                  onClick={() => setShowSangriaModal(false)}
                  disabled={sangriaLoading}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-confirmar sangria"
                  disabled={sangriaLoading}
                >
                  {sangriaLoading ? 'Enviando...' : 'Confirmar Sangria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}