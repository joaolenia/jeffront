import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import api from '../../api';
import './MercadoriaCadastro.css';

interface ParcelaPayload {
  numero: number;
  valor: number;
  vencimento: string;
  status: string;
  formaPagamento: string;
}

interface Props {
  onSuccess: () => void;
  onCancelar: () => void;
}

export function MercadoriaCadastro({ onSuccess, onCancelar }: Props) {
  const [fornecedor, setFornecedor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  
  const [usaCaixa, setUsaCaixa] = useState(false);
  const [valCaixa, setValCaixa] = useState('');
  const [usaCofre, setUsaCofre] = useState(false);
  const [valCofre, setValCofre] = useState('');
  const [usaBoleto, setUsaBoleto] = useState(false);
  const [valBoleto, setValBoleto] = useState('');
  
  const [parcelas, setParcelas] = useState('1');
  const [vencimento, setVencimento] = useState('');
  
  // Estado para armazenar as parcelas geradas, permitindo a edição manual
  const [parcelasGeradas, setParcelasGeradas] = useState<ParcelaPayload[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numTotal = parseFloat(valorTotal) || 0;
  const numCaixa = usaCaixa ? (parseFloat(valCaixa) || 0) : 0;
  const numCofre = usaCofre ? (parseFloat(valCofre) || 0) : 0;
  const numBoleto = usaBoleto ? (parseFloat(valBoleto) || 0) : 0;
  
  // Utiliza toFixed para evitar pequenos bugs de precisão do JS (ex: 0.1 + 0.2)
  const somaPagamentos = Number((numCaixa + numCofre + numBoleto).toFixed(2));
  const restante = Number((numTotal - somaPagamentos).toFixed(2));
  
  const isFormValid = numTotal > 0 && restante === 0 && fornecedor.trim() !== '';

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Helper para gerar YYYY-MM-DD de forma segura usando timezone local
  const formatDateLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Efeito para gerar as parcelas automaticamente quando os valores base mudam
  useEffect(() => {
    if (usaBoleto && numBoleto > 0) {
      const qtd = parseInt(parcelas) || 1;
      const valorPorParcela = numBoleto / qtd;
      
      // Adicionando T12:00:00 para forçar o meio do dia e evitar transição de data por fuso
      let dataBase = vencimento ? new Date(`${vencimento}T12:00:00`) : new Date();
      
      const novasParcelas: ParcelaPayload[] = [];
      for (let i = 1; i <= qtd; i++) {
        const dataVenc = new Date(dataBase);
        dataVenc.setDate(dataVenc.getDate() + ((i - 1) * 30));
        
        novasParcelas.push({
          numero: i,
          valor: Number(valorPorParcela.toFixed(2)),
          vencimento: formatDateLocal(dataVenc),
          status: 'pendente',
          formaPagamento: 'Boleto'
        });
      }
      setParcelasGeradas(novasParcelas);
    } else {
      setParcelasGeradas([]);
    }
  }, [usaBoleto, numBoleto, parcelas, vencimento]);

  // Handler para atualizar apenas a data de uma parcela específica
  const handleDataParcelaChange = (index: number, novaData: string) => {
    const atualizadas = [...parcelasGeradas];
    atualizadas[index].vencimento = novaData;
    setParcelasGeradas(atualizadas);
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    // Validação extra: não enviar com data de vencimento em branco
    if (usaBoleto && numBoleto > 0) {
      const temInvalida = parcelasGeradas.some(p => !p.vencimento);
      if (temInvalida) {
        alert('Por favor, certifique-se de que todas as parcelas possuam uma data de vencimento válida.');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // 1. Integrar com Cofre - Faz a saída primeiro
      if (usaCofre && numCofre > 0) {
        try {
          await api.post('/cofre/movimentacao', {
            tipo: 'saida',
            valor: numCofre,
            descricao: 'Compra de mercadoria',
            origem: 'mercadoria'
          });
        } catch (error: any) {
          console.error('Erro na movimentação do cofre:', error);
          alert(error.response?.data?.message || 'Erro ao registrar a saída no cofre. A mercadoria não foi salva.');
          setIsSubmitting(false);
          return; // Trava a execução e não cria a mercadoria
        }
      }

      // 2. Registra a Mercadoria
      const payload = {
        fornecedorNome: fornecedor,
        observacao: observacao.trim() === '' ? null : observacao,
        valorNota: numTotal,
        valorPagoCaixa: numCaixa,
        valorPagoCofre: numCofre,
        valorPrazo: numBoleto,
        statusGeral: (usaBoleto && numBoleto > 0) ? 'pendente' : 'concluido',
        dataOperacao: formatDateLocal(new Date()),
        parcelas: parcelasGeradas
      };

      await api.post('/mercadorias', payload);
      alert('Mercadoria registrada com sucesso!');
      onSuccess(); 
    } catch (error: any) {
      console.error('Erro ao salvar mercadoria:', error);
      alert(error.response?.data?.message || 'Ocorreu um erro ao tentar salvar a operação da mercadoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mcad-container">
      <div className="mcad-header">
        <button onClick={onCancelar} style={{background: 'none', border: 'none', cursor: 'pointer'}} disabled={isSubmitting}>
          <ArrowLeft size={28} color="#64748b" />
        </button>
        <h2 style={{margin: 0, fontSize: '1.8rem', color: '#0f172a'}}>Registrar Mercadoria</h2>
      </div>

      <div className="mcad-row">
        <div className="mcad-group">
          <label>Nome do Fornecedor *</label>
          <input className="mcad-input" value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: Coca-Cola, Ambev..." autoFocus disabled={isSubmitting} />
        </div>
        <div className="mcad-group">
          <label>Valor Total da Nota (R$) *</label>
          <input type="number" step="0.01" className="mcad-input" value={valorTotal} onChange={e => setValorTotal(e.target.value)} placeholder="0.00" disabled={isSubmitting} />
        </div>
      </div>

      <div className="mcad-group" style={{ marginBottom: '24px' }}>
        <label>Observação (Opcional)</label>
        <input className="mcad-input" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Ex: Material de limpeza, bebidas para o final de semana..." disabled={isSubmitting} />
      </div>

      <div className="mcad-split-box">
        <h3 style={{marginTop: 0, fontSize: '1.15rem', color: '#1e293b', marginBottom: 20}}>Como foi feito o pagamento?</h3>
        
        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCaixa} onChange={e => setUsaCaixa(e.target.checked)} disabled={isSubmitting}/> Dinheiro retirado do Caixa
          </label>
          {usaCaixa && <input type="number" step="0.01" className="mcad-input" style={{width: 180}} value={valCaixa} onChange={e => setValCaixa(e.target.value)} placeholder="R$ 0,00" disabled={isSubmitting}/>}
        </div>

        <div className="mcad-split-item">
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaCofre} onChange={e => setUsaCofre(e.target.checked)} disabled={isSubmitting}/> Dinheiro retirado do Cofre
          </label>
          {usaCofre && <input type="number" step="0.01" className="mcad-input" style={{width: 180}} value={valCofre} onChange={e => setValCofre(e.target.value)} placeholder="R$ 0,00" disabled={isSubmitting}/>}
        </div>

        <div className="mcad-split-item" style={{border: 'none'}}>
          <label className="mcad-split-label">
            <input type="checkbox" checked={usaBoleto} onChange={e => setUsaBoleto(e.target.checked)} disabled={isSubmitting}/> Faturado / Boleto a Prazo
          </label>
          {usaBoleto && <input type="number" step="0.01" className="mcad-input" style={{width: 180}} value={valBoleto} onChange={e => setValBoleto(e.target.value)} placeholder="R$ 0,00" disabled={isSubmitting}/>}
        </div>

        {usaBoleto && (
          <div className="mcad-boleto-config">
            <div className="mcad-group">
              <label>Número de Parcelas</label>
              <input type="number" min="1" className="mcad-input" value={parcelas} onChange={e => setParcelas(e.target.value)} disabled={isSubmitting} />
            </div>
            <div className="mcad-group">
              <label>Data Base (1º Vencimento)</label>
              <input type="date" className="mcad-input" value={vencimento} onChange={e => setVencimento(e.target.value)} disabled={isSubmitting} />
            </div>
            
            {/* Lista visual das parcelas geradas permitindo edição */}
            {parcelasGeradas.length > 0 && (
              <div className="mcad-parcelas-list">
                <h4 style={{margin: '0 0 12px 0', color: '#334155'}}>Parcelas Geradas</h4>
                <div className="mcad-parcelas-grid">
                  {parcelasGeradas.map((parcela, index) => (
                    <div key={index} className="mcad-parcela-card">
                      <div className="parcela-header">
                        <span className="parcela-numero">Parcela {parcela.numero}/{parcelasGeradas.length}</span>
                        <span className="parcela-valor">{formatCurrency(parcela.valor)}</span>
                      </div>
                      <div className="parcela-body">
                        <label>Vencimento:</label>
                        <input 
                          type="date" 
                          className="mcad-input mcad-input-sm" 
                          value={parcela.vencimento}
                          onChange={e => handleDataParcelaChange(index, e.target.value)}
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mcad-footer">
        <div style={{fontWeight: 700, fontSize: '1.1rem', color: restante === 0 ? '#16a34a' : '#ef4444'}}>
          {numTotal === 0 ? 'Informe o valor da nota' : restante === 0 ? '✔️ Divisão de valores exata' : `Falta alocar: ${formatCurrency(restante)}`}
        </div>
        <button 
          className="mcad-btn-salvar" 
          disabled={!isFormValid || isSubmitting} 
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Salvando...' : 'Finalizar Registro'}
        </button>
      </div>
    </div>
  );
}