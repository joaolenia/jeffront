import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  RefreshCcw,
  TrendingDown,
} from 'lucide-react';
import api from '../../api';
import './RelatoriosSaida.css';

interface ParcelaMercadoria {
  numero?: number;
  vencimento?: string;
  valor?: number;
  status?: 'pendente' | 'pago' | string;
  formaPagamento?: string;
  dataPagamento?: string;
}

interface MercadoriaOperacao {
  id?: number;
  fornecedorNome?: string;
  valorNota?: number;
  descricao?: string;
  valorPagoCaixa?: number;
  valorPagoCofre?: number;
  valorPrazo?: number;
  statusGeral?: string;
  dataOperacao?: string | Date;
  parcelas?: ParcelaMercadoria[] | string;
  dataCriacao?: string | Date;
  dataAtualizacao?: string | Date;
}

interface TotaisRelatorio {
  caixa: number;
  cofre: number;
  total: number;
  parcelasPagas: number;
  operacoes: number;
}

const moeda = (valor: number) =>
  Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

const obterDataLocal = (data = new Date()) => {
  const local = new Date(
    data.getTime() - data.getTimezoneOffset() * 60000
  );

  return local.toISOString().slice(0, 10);
};

const calcularDataAnterior = (dias: number) => {
  const data = new Date();
  data.setDate(data.getDate() - dias);

  return obterDataLocal(data);
};

// ==============================================================
// EXTRAÇÃO DE DATA COM LOG PARA DEBUGAR O FORMATO
// ==============================================================
const extrairData = (
  valor?: string | Date | null
): string => {
  if (!valor) return '';

  if (valor instanceof Date) {
    return obterDataLocal(valor);
  }

  let texto = String(valor).trim();
  if (!texto) return '';

  // Remove os microsegundos se houver (ex: .000000)
  if (texto.includes('.')) {
    texto = texto.split('.')[0];
  }

  // Se contiver espaço ou 'T' (ex: "2026-09-02")
  if (texto.includes('T') || texto.includes(' ')) {
    let isoString = texto.replace(' ', 'T');
    if (!isoString.endsWith('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
      isoString += 'Z'; 
    }
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const formatada = obterDataLocal(d);
      return formatada;
    }
  }

  // Fallback para datas puras
  return texto.split('T')[0].split(' ')[0];
};
// ==============================================================

const converterNumero = (valor: unknown) => {
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
};

const obterParcelas = (
  parcelas?: ParcelaMercadoria[] | string
): ParcelaMercadoria[] => {
  if (!parcelas) {
    return [];
  }

  if (Array.isArray(parcelas)) {
    return parcelas;
  }

  try {
    const resultado = JSON.parse(parcelas);

    return Array.isArray(resultado)
      ? resultado
      : [];
  } catch (err) {
    console.error('Erro ao fazer JSON.parse das parcelas:', err);
    return [];
  }
};

const pagamentoNoCofre = (formaPagamento?: string) => {
  const forma = String(formaPagamento || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return forma.includes('cofre');
};

export default function RelatoriosSaida() {
  const hoje = obterDataLocal();

  const [periodo, setPeriodo] = useState('hoje');

  const [dataInicial, setDataInicial] =
    useState(hoje);

  const [dataFinal, setDataFinal] =
    useState(hoje);

  const [mercadorias, setMercadorias] =
    useState<MercadoriaOperacao[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const buscarDados = async () => {
    if (!dataInicial || !dataFinal) {
      return;
    }

    if (dataInicial > dataFinal) {
      setError(
        'A data inicial não pode ser maior que a data final.'
      );

      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/mercadorias', {
        params: {
          dataInicial,
          dataFinal,
        },
      });

      const dados = Array.isArray(response.data)
        ? response.data
        : [];

      console.log('📌 Dados brutos recebidos do backend (/mercadorias):', dados);
      setMercadorias(dados);
    } catch (err) {
      console.error(
        'Erro ao buscar operações:',
        err
      );

      setMercadorias([]);

      setError(
        'Não foi possível carregar os dados do relatório.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    buscarDados();
  }, [dataInicial, dataFinal]);

  const alterarPeriodo = (
    novoPeriodo: string
  ) => {
    setPeriodo(novoPeriodo);

    if (novoPeriodo === 'custom') {
      return;
    }

    const fim = obterDataLocal();

    setDataFinal(fim);

    if (novoPeriodo === 'hoje') {
      setDataInicial(fim);
      return;
    }

    setDataInicial(
      calcularDataAnterior(
        Number(novoPeriodo)
      )
    );
  };

  const relatorio = useMemo<TotaisRelatorio>(() => {
    let caixa = 0;
    let cofre = 0;
    let parcelasPagas = 0;
    let operacoes = 0;

    const operacoesProcessadas =
      new Set<number>();

    const parcelasProcessadas =
      new Set<string>();

    console.log(`🔎 Filtrando relatório entre [${dataInicial}] e [${dataFinal}]`);

    mercadorias.forEach(mercadoria => {
      const id = converterNumero(
        mercadoria.id
      );

      if (!id) {
        return;
      }

      // Verificamos se a operação teve valores de entrada à vista dentro do período
      const dataAtualizacao = extrairData(mercadoria.dataAtualizacao);
      const operacaoNoPeriodo = dataAtualizacao && dataAtualizacao >= dataInicial && dataAtualizacao <= dataFinal;

      if (operacaoNoPeriodo && !operacoesProcessadas.has(id)) {
        operacoesProcessadas.add(id);
        operacoes++;

        const valorCaixa = converterNumero(mercadoria.valorPagoCaixa);
        const valorCofre = converterNumero(mercadoria.valorPagoCofre);

        caixa += valorCaixa;
        cofre += valorCofre;
      }

      // Analisamos as parcelas
      const parcelas =
        obterParcelas(
          mercadoria.parcelas
        );

      if (parcelas.length > 0) {
        console.log(`📦 Mercadoria ID ${id} possui ${parcelas.length} parcela(s):`, parcelas);
      }

      parcelas.forEach(
        (parcela, index) => {
          console.log(`👉 Analisando parcela [${index + 1}] da mercadoria ID ${id}:`, parcela);

          if (
            String(parcela.status)
              .toLowerCase() !== 'pago'
          ) {
            console.log(`❌ Parcela ignorada: Status é '${parcela.status}' (diferente de 'pago')`);
            return;
          }

          const dataPagamento =
            extrairData(
              parcela.dataPagamento
            );

          if (!dataPagamento) {
            console.log(`❌ Parcela ignorada: dataPagamento vazia ou inválida. Valor original:`, parcela.dataPagamento);
            return;
          }

          console.log(`📅 Data de pagamento extraída: [${dataPagamento}] (Range permitido: ${dataInicial} até ${dataFinal})`);

          if (
            dataPagamento < dataInicial ||
            dataPagamento > dataFinal
          ) {
            console.log(`❌ Parcela ignorada: Fora do período selecionado.`);
            return;
          }

          const numeroParcela =
            parcela.numero !== undefined
              ? converterNumero(
                  parcela.numero
                )
              : index + 1;

          const chave =
            `${id}-${numeroParcela}`;

          if (
            parcelasProcessadas.has(chave)
          ) {
            console.log(`⚠️ Parcela duplicada ignorada: ${chave}`);
            return;
          }

          parcelasProcessadas.add(chave);

          const valor =
            converterNumero(
              parcela.valor
            );

          if (valor <= 0) {
            console.log(`❌ Parcela ignorada: Valor zerado ou inválido (${valor})`);
            return;
          }

          console.log(`✅ PARCELA CONTABILIZADA COM SUCESSO! Valor: R$ ${valor}, Forma: ${parcela.formaPagamento}`);
          parcelasPagas++;

          if (
            pagamentoNoCofre(
              parcela.formaPagamento
            )
          ) {
            cofre += valor;
          } else {
            caixa += valor;
          }
        }
      );
    });

    const resultadoFinal = {
      caixa,
      cofre,
      total: caixa + cofre,
      parcelasPagas,
      operacoes,
    };

    console.log('📊 Resultado final do Relatório de Saídas:', resultadoFinal);
    return resultadoFinal;
  }, [
    mercadorias,
    dataInicial,
    dataFinal,
  ]);

  const periodos = [
    {
      value: 'hoje',
      label: 'Hoje',
    },
    {
      value: '7',
      label: '7 dias',
    },
    {
      value: '15',
      label: '15 dias',
    },
    {
      value: '30',
      label: '30 dias',
    },
    {
      value: '45',
      label: '45 dias',
    },
    {
      value: '60',
      label: '60 dias',
    },
  ];

  return (
    <main className="relatorio-saidas">
      <header className="relatorio-saidas__header">
        <div>
          <span className="relatorio-saidas__eyebrow">
            Financeiro
          </span>

          <h1>
            Relatório de Saídas
          </h1>

          <p>
            Acompanhe os valores retirados
            do caixa e do cofre.
          </p>
        </div>

      </header>

      <section className="relatorio-saidas__filters">
        <div className="relatorio-saidas__filter-title">
          <Calendar size={18} />

          <span>
            Período
          </span>
        </div>

        <div className="relatorio-saidas__periods">
          {periodos.map(item => (
            <button
              type="button"
              key={item.value}
              className={
                periodo === item.value
                  ? 'active'
                  : ''
              }
              onClick={() =>
                alterarPeriodo(
                  item.value
                )
              }
            >
              {item.label}
            </button>
          ))}

          <button
            type="button"
            className={
              periodo === 'custom'
                ? 'active'
                : ''
            }
            onClick={() =>
              alterarPeriodo('custom')
            }
          >
            Personalizado
          </button>
        </div>

        {periodo === 'custom' && (
          <div className="relatorio-saidas__custom">
            <label>
              <span>
                Data inicial
              </span>

              <input
                type="date"
                value={dataInicial}
                onChange={event => {
                  setPeriodo('custom');

                  setDataInicial(
                    event.target.value
                  );
                }}
              />
            </label>

            <label>
              <span>
                Data final
              </span>

              <input
                type="date"
                value={dataFinal}
                onChange={event => {
                  setPeriodo('custom');

                  setDataFinal(
                    event.target.value
                  );
                }}
              />
            </label>
          </div>
        )}
      </section>

      {error && (
        <div className="relatorio-saidas__message relatorio-saidas__message--error">
          <AlertCircle size={20} />

          <span>
            {error}
          </span>
        </div>
      )}

      {loading ? (
        <div className="relatorio-saidas__loading">
          <RefreshCcw
            size={24}
            className="is-spinning"
          />

          <span>
            Processando relatório...
          </span>
        </div>
      ) : (
        !error && (
          <>
            <section className="relatorio-saidas__hero">
              <div className="relatorio-saidas__hero-icon">
                <TrendingDown size={28} />
              </div>

              <div>
                <span>
                  Total de saídas
                </span>

                <strong>
                  {moeda(
                    relatorio.total
                  )}
                </strong>

                <small>
                  Total contabilizado
                  no período selecionado
                </small>
              </div>
            </section>

            <section className="relatorio-saidas__grid">
              <article className="relatorio-saidas__card">
                <div className="relatorio-saidas__card-top">
                  <span>
                    Caixa
                  </span>

                  <div className="relatorio-saidas__dot relatorio-saidas__dot--caixa" />
                </div>

                <strong>
                  {moeda(
                    relatorio.caixa
                  )}
                </strong>

                <small>
                  Pagamentos retirados
                  do caixa
                </small>
              </article>

              <article className="relatorio-saidas__card">
                <div className="relatorio-saidas__card-top">
                  <span>
                    Cofre
                  </span>

                  <div className="relatorio-saidas__dot relatorio-saidas__dot--cofre" />
                </div>

                <strong>
                  {moeda(
                    relatorio.cofre
                  )}
                </strong>

                <small>
                  Pagamentos retirados
                  do cofre
                </small>
              </article>

              <article className="relatorio-saidas__card">
                <div className="relatorio-saidas__card-top">
                  <span>
                    Parcelas pagas
                  </span>
                </div>

                <strong>
                  {relatorio.parcelasPagas}
                </strong>

                <small>
                  Baixas realizadas
                  no período
                </small>
              </article>
            </section>
          </>
        )
      )}
    </main>
  );
}