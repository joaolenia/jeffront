
interface Item {
  id: number;
  nome: string;
  qtd: number;
  preco: number;
}

interface CupomFiscalProps {
  itens: Item[];
  total: number;
  formaPagamento: string;
  valorRecebido: number;
  troco: number;
}

export function CupomFiscal({
  itens,
  total,
  formaPagamento,
  valorRecebido,
  troco,
}: CupomFiscalProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const dataAtual = new Date().toLocaleString('pt-BR');

  const linha = {
    border: '0',
    borderTop: '2px dashed #000',
    margin: '7px 0',
  };

  return (
    <div
      id="print-section"
      className="cupom-container"
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#000',
        fontSize: '14px',
        lineHeight: '1.15',
        boxSizing: 'border-box',
      }}
    >
      {/* CABEÇALHO */}
      <div
        className="cupom-header"
        style={{
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            margin: '0 0 5px 0',
            fontSize: '21px',
            fontWeight: 900,
            lineHeight: '1.1',
          }}
        >
          MERCADO BOM JESUS
        </h2>

        <p
          style={{
            margin: '2px 0',
            fontSize: '13px',
          }}
        >
          Av. Ver. Venceslau Gaias, SN
        </p>

        <p
          style={{
            margin: '2px 0',
            fontSize: '13px',
          }}
        >
          Santana, Cruz Machado - PR
        </p>

        <p
          style={{
            margin: '2px 0',
            fontSize: '13px',
          }}
        >
          CEP: 84623-000
        </p>

        <p
          style={{
            margin: '2px 0',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          CNPJ: 68.193.177/0001-95
        </p>

        <p
          className="cupom-data"
          style={{
            margin: '3px 0',
            fontSize: '13px',
            fontWeight: 700,
          }}
        >
          {dataAtual}
        </p>

        <hr style={linha} />

        <h3
          style={{
            margin: '5px 0',
            fontSize: '17px',
            fontWeight: 900,
          }}
        >
          CUPOM NÃO FISCAL
        </h3>

        <hr style={linha} />
      </div>

      {/* PRODUTOS */}
      <table
        className="cupom-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          margin: 0,
        }}
      >
        <thead>
          <tr>
            <th
              className="col-qtd"
              style={{
                width: '13%',
                padding: '3px 0',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              QTD
            </th>

            <th
              className="col-desc"
              style={{
                width: '39%',
                padding: '3px 2px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              DESCRIÇÃO
            </th>

            <th
              className="col-unit"
              style={{
                width: '23%',
                padding: '3px 0',
                textAlign: 'right',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              V.UN
            </th>

            <th
              className="col-total"
              style={{
                width: '25%',
                padding: '3px 0',
                textAlign: 'right',
                fontSize: '12px',
                fontWeight: 900,
              }}
            >
              TOTAL
            </th>
          </tr>
        </thead>

        <tbody>
          {itens.map((item) => (
            <tr key={item.id}>
              <td
                className="col-qtd"
                style={{
                  padding: '4px 0',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  verticalAlign: 'top',
                }}
              >
                {item.qtd}
              </td>

              <td
                className="col-desc"
                style={{
                  padding: '4px 2px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  verticalAlign: 'top',
                  overflowWrap: 'break-word',
                }}
              >
                {item.nome}
              </td>

              <td
                className="col-unit"
                style={{
                  padding: '4px 0',
                  textAlign: 'right',
                  fontSize: '13px',
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatCurrency(item.preco)}
              </td>

              <td
                className="col-total"
                style={{
                  padding: '4px 0',
                  textAlign: 'right',
                  fontSize: '13px',
                  fontWeight: 800,
                  verticalAlign: 'top',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatCurrency(item.qtd * item.preco)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* RODAPÉ */}
      <div
        className="cupom-footer"
        style={{
          marginTop: '2px',
        }}
      >
        <hr style={linha} />

        {/* TOTAL */}
        <div
          className="total-row"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            padding: '3px 0 5px',
          }}
        >
          <span
            style={{
              fontSize: '19px',
              fontWeight: 900,
            }}
          >
            TOTAL
          </span>

          <span
            style={{
              fontSize: '20px',
              fontWeight: 900,
              whiteSpace: 'nowrap',
            }}
          >
            {formatCurrency(total)}
          </span>
        </div>

        {/* PAGAMENTO */}
        <div
          className="payment-info"
          style={{
            width: '100%',
            marginTop: '5px',
            fontSize: '14px',
          }}
        >
          {/* PAGAMENTO */}
          <div
            style={{
              display: 'block',
              width: '100%',
              padding: '3px 0',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: '1px',
              }}
            >
              Pagamento:
            </div>

            <div
              style={{
                fontWeight: 900,
                width: '100%',
              }}
            >
              {formaPagamento}
            </div>
          </div>

          {/* RECEBIDO */}
          {formaPagamento === 'Dinheiro' && (
            <>
              <div
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '3px 0',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: '1px',
                  }}
                >
                  Recebido:
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    width: '100%',
                  }}
                >
                  {formatCurrency(valorRecebido)}
                </div>
              </div>

              {/* TROCO */}
              <div
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '3px 0',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: '1px',
                  }}
                >
                  Troco:
                </div>

                <div
                  style={{
                    fontWeight: 900,
                    fontSize: '15px',
                    width: '100%',
                  }}
                >
                  {formatCurrency(troco)}
                </div>
              </div>
            </>
          )}
        </div>

        <hr style={linha} />

        {/* MENSAGEM */}
        <div
          style={{
            textAlign: 'center',
            width: '100%',
          }}
        >
          <p
            className="agradecimento"
            style={{
              margin: '5px 0 3px',
              fontSize: '14px',
              fontWeight: 700,
            }}
          >
            Obrigado pela preferência!
          </p>

          <p
            className="volte-sempre"
            style={{
              margin: '3px 0',
              fontSize: '17px',
              fontWeight: 900,
            }}
          >
            VOLTE SEMPRE
          </p>
        </div>
      </div>
    </div>
  );
}

