import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Reembolso",
  description:
    "Como pedir reembolso do Manual Prático do Outfit, incluindo o direito de arrependimento de 7 dias.",
};

export default function ReembolsoPage() {
  return (
    <>
      <h1>Política de Reembolso</h1>
      <p className="atualizado">Última atualização: 28 de julho de 2026</p>

      <div className="destaque">
        <p>
          <strong>Resumo:</strong> você tem <strong>7 dias corridos</strong> a
          partir da compra para desistir e receber 100% do valor de volta, sem
          precisar justificar. É o direito de arrependimento previsto no artigo
          49 do Código de Defesa do Consumidor.
        </p>
      </div>

      <h2>1. Direito de arrependimento (7 dias)</h2>
      <p>
        Como a compra é feita pela internet, o artigo 49 do Código de Defesa do
        Consumidor garante que você pode desistir em até 7 dias corridos,
        contados da data da compra ou do recebimento do acesso, o que ocorrer
        por último.
      </p>
      <p>
        Nesse prazo, <strong>não precisamos de motivo</strong>. Você não precisa
        explicar por que mudou de ideia, não precisa provar que tentou usar e
        não perde o direito por ter acessado o conteúdo. O valor é devolvido
        integralmente, incluindo os bônus e pacotes de tokens comprados na mesma
        transação.
      </p>

      <h2>2. Como pedir</h2>
      <ol>
        <li>
          Envie um e-mail para{" "}
          <a href="mailto:equipe@manualpraticodooutfit.com.br">
            equipe@manualpraticodooutfit.com.br
          </a>{" "}
          com o assunto <strong>&quot;Reembolso&quot;</strong>.
        </li>
        <li>
          Informe o e-mail usado na compra e, se tiver, o número do pedido que
          aparece no comprovante da Cakto.
        </li>
        <li>
          Confirmamos o recebimento em até 2 dias úteis e processamos o estorno
          junto ao meio de pagamento.
        </li>
      </ol>

      <h2>3. Prazo para o dinheiro voltar</h2>
      <p>
        O estorno é solicitado por nós em até 2 dias úteis. O tempo até o
        dinheiro aparecer na sua conta depende do meio de pagamento:
      </p>
      <ul>
        <li>
          <strong>PIX:</strong> em geral de 1 a 3 dias úteis.
        </li>
        <li>
          <strong>Cartão de crédito:</strong> o estorno aparece na fatura
          seguinte ou na subsequente, conforme a data de fechamento do seu
          cartão. Esse prazo é do banco emissor, não nosso.
        </li>
        <li>
          <strong>Boleto:</strong> até 10 dias úteis, e precisamos dos seus
          dados bancários para fazer a transferência.
        </li>
      </ul>

      <h2>4. O que acontece com o acesso</h2>
      <p>
        Ao processarmos o reembolso, o acesso à plataforma é encerrado
        automaticamente: o produto principal, todos os bônus liberados naquela
        compra e o saldo de tokens de análise de imagem não utilizados. Você
        deixa de conseguir entrar na área de alunos.
      </p>
      <p>
        As fotos que você tiver enviado para a comunidade e o histórico das suas
        conversas com o Fit Check são apagados junto, conforme a{" "}
        <a href="/privacidade">Política de Privacidade</a>. Se quiser guardar
        alguma coisa, salve antes de pedir o reembolso.
      </p>

      <h2>5. Depois dos 7 dias</h2>
      <p>
        Passado o prazo de arrependimento, não há devolução automática — o
        conteúdo é digital e fica integralmente disponível desde o primeiro dia.
        Ainda assim, se você tiver um problema real (não conseguiu acessar,
        recebeu conteúdo diferente do anunciado, houve cobrança em duplicidade),
        escreva para a gente. Cobrança duplicada é sempre devolvida, em qualquer
        prazo.
      </p>

      <h2>6. Assinaturas com renovação</h2>
      <p>
        Nos planos com prazo (30 dias ou 1 ano), o cancelamento interrompe as
        cobranças futuras e o acesso continua válido até o fim do período já
        pago. Não há cobrança de multa por cancelamento.
      </p>

      <h2>7. Chargeback</h2>
      <p>
        Se você abrir uma contestação direto no banco sem falar com a gente
        antes, o acesso também é encerrado assim que somos notificados. Pedimos
        que tente o e-mail primeiro: resolvemos mais rápido e sem burocracia.
      </p>

      <h2>8. Fale com a gente</h2>
      <p>
        Qualquer dúvida sobre reembolso:{" "}
        <a href="mailto:equipe@manualpraticodooutfit.com.br">
          equipe@manualpraticodooutfit.com.br
        </a>
        .
      </p>
    </>
  );
}
