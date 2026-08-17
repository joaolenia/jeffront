export type Parcela = {
  numero: number;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'paga';
  origemPgto?: 'caixa' | 'cofre';
};

export type Mercadoria = {
  id: number;
  fornecedor: string;
  data: string;
  valorTotal: number;
  status: 'pendente' | 'paga';
  pagamento: {
    caixa: number;
    cofre: number;
    boleto: number;
  };
  parcelasBoleto: Parcela[];
};