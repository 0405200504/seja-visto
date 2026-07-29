import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o Manual Prático do Outfit trata seus dados pessoais, incluindo as fotos enviadas para o Fit Check e para a comunidade.",
};

export default function PrivacidadePage() {
  return (
    <>
      <h1>Política de Privacidade</h1>
      <p className="atualizado">Última atualização: 28 de julho de 2026</p>

      <p>
        Esta política explica quais dados o Manual Prático do Outfit coleta, por
        que coleta, com quem compartilha e o que você pode exigir da gente. Ela
        segue a Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>

      <div className="destaque">
        <p>
          <strong>O ponto mais importante:</strong> se você enviar fotos suas
          para o Fit Check ou para a comunidade, essas imagens são dados
          pessoais. Elas ficam em armazenamento privado, só são exibidas para
          quem tem acesso à plataforma, e você pode apagar todas a qualquer
          momento.
        </p>
      </div>

      <h2>1. Quem é o responsável</h2>
      <p>
        O responsável pelo tratamento dos seus dados é o operador do Manual
        Prático do Outfit. Para qualquer assunto de privacidade, incluindo
        pedidos de acesso ou exclusão, escreva para{" "}
        <a href="mailto:equipe@manualpraticodooutfit.com.br">
          equipe@manualpraticodooutfit.com.br
        </a>
        .
      </p>

      <h2>2. Que dados coletamos</h2>

      <h3>Dados de cadastro e compra</h3>
      <ul>
        <li>Nome e e-mail, informados por você ou recebidos do gateway de pagamento.</li>
        <li>Telefone, quando você o fornece na compra (usado para enviar o acesso).</li>
        <li>
          Registro das suas compras: valor, data, forma de pagamento e produto.
          Não recebemos nem armazenamos número de cartão de crédito.
        </li>
      </ul>

      <h3>Dados de uso da plataforma</h3>
      <ul>
        <li>Respostas do quiz de estilo, para personalizar as recomendações.</li>
        <li>Aulas concluídas, combinações favoritadas e itens do guarda-roupa.</li>
        <li>Data do último acesso.</li>
      </ul>

      <h3>Fotos e conversas com a IA</h3>
      <ul>
        <li>
          <strong>Fotos enviadas ao Fit Check:</strong> a imagem em tamanho
          cheio é enviada à OpenAI para análise e <strong>não</strong> é
          guardada por nós. Fica salva no seu histórico apenas uma miniatura, e
          o texto da conversa.
        </li>
        <li>
          <strong>Fotos enviadas à comunidade:</strong> ficam guardadas em
          armazenamento privado, acessíveis por link temporário e assinado,
          apenas para pessoas com acesso ativo à plataforma.
        </li>
      </ul>

      <h2>3. Base legal e consentimento</h2>
      <p>
        Tratamos seus dados com base na <strong>execução do contrato</strong>{" "}
        (artigo 7º, V da LGPD) para tudo que é necessário para entregar o
        produto que você comprou: criar sua conta, liberar o acesso, salvar seu
        progresso e processar o pagamento.
      </p>
      <p>
        Para as <strong>suas fotos</strong>, a base é o seu{" "}
        <strong>consentimento</strong> (artigo 7º, I). Enviar uma foto é sempre
        opcional: a plataforma funciona inteira sem isso. Ao enviar, você
        consente com o uso descrito nesta política, e pode retirar o
        consentimento a qualquer momento apagando as imagens ou pedindo a
        exclusão por e-mail.
      </p>
      <p>
        Para <strong>e-mails de marketing</strong> (novidades, promoções), a
        base é o consentimento, dado à parte. Todo e-mail desse tipo traz link
        de descadastro, e sair da lista não afeta seu acesso ao produto. E-mails
        operacionais — acesso liberado, recuperação de senha, aviso de
        vencimento — fazem parte do contrato e continuam sendo enviados.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <p>
        Não vendemos seus dados. Compartilhamos apenas com os prestadores
        necessários para o serviço funcionar:
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> — banco de dados, autenticação e
          armazenamento de arquivos.
        </li>
        <li>
          <strong>Vercel</strong> — hospedagem da aplicação.
        </li>
        <li>
          <strong>Cakto</strong> — processamento dos pagamentos.
        </li>
        <li>
          <strong>OpenAI</strong> — análise das fotos e mensagens do Fit Check.
          As imagens são processadas para gerar a resposta.
        </li>
        <li>
          <strong>Resend e Google (Gmail)</strong> — envio dos e-mails.
        </li>
        <li>
          <strong>UAZAPI</strong> — envio das mensagens de WhatsApp, quando você
          informa o telefone.
        </li>
      </ul>
      <p>
        Alguns desses serviços processam dados fora do Brasil. A transferência
        internacional é feita nos termos do artigo 33 da LGPD, limitada ao que é
        necessário para prestar o serviço.
      </p>

      <h2>5. Por quanto tempo guardamos</h2>
      <ul>
        <li>
          <strong>Conta e progresso:</strong> enquanto sua conta existir.
        </li>
        <li>
          <strong>Fotos da comunidade e conversas do Fit Check:</strong> até
          você apagar, ou até a exclusão da conta.
        </li>
        <li>
          <strong>Registros de venda:</strong> mantidos por 5 anos mesmo após a
          exclusão da conta, por obrigação fiscal e contábil (artigo 16, I da
          LGPD). Nesse caso guardamos apenas o necessário: e-mail, valor, data e
          identificador da transação.
        </li>
      </ul>

      <h2>6. Seus direitos</h2>
      <p>Você pode, a qualquer momento e sem custo:</p>
      <ul>
        <li>Saber quais dados temos sobre você e receber uma cópia deles.</li>
        <li>Corrigir dado incompleto ou desatualizado.</li>
        <li>Pedir a exclusão dos seus dados e da sua conta.</li>
        <li>Retirar o consentimento do uso das suas fotos.</li>
        <li>Saber com quem compartilhamos seus dados.</li>
        <li>Reclamar à ANPD (Autoridade Nacional de Proteção de Dados).</li>
      </ul>
      <p>
        Para exercer qualquer um desses direitos, escreva para{" "}
        <a href="mailto:equipe@manualpraticodooutfit.com.br">
          equipe@manualpraticodooutfit.com.br
        </a>
        . Respondemos em até 15 dias.
      </p>

      <h3>Como excluir sua conta</h3>
      <p>
        Peça por e-mail. A exclusão apaga de forma definitiva seu perfil,
        respostas do quiz, progresso, favoritos, guarda-roupa, fotos enviadas à
        comunidade, conversas do Fit Check e saldo de tokens. Preservamos apenas
        o registro fiscal da venda, pelo prazo legal descrito no item 5.
      </p>

      <h2>7. Segurança</h2>
      <p>
        Os dados trafegam sempre por conexão criptografada. O acesso ao banco é
        restrito por políticas que isolam os dados de cada aluno. As fotos ficam
        em armazenamento privado, servidas por links temporários que expiram. As
        senhas são guardadas com hash, e nunca temos acesso à sua senha em texto
        legível.
      </p>
      <p>
        Em caso de incidente de segurança que possa gerar risco relevante a
        você, comunicaremos você e a ANPD, conforme o artigo 48 da LGPD.
      </p>

      <h2>8. Cookies</h2>
      <p>
        Usamos apenas os cookies necessários para manter você conectado. Não há
        cookies de publicidade nem rastreamento de terceiros para perfilamento.
      </p>

      <h2>9. Menores de idade</h2>
      <p>
        A plataforma é destinada a maiores de 18 anos. Não coletamos dados de
        crianças e adolescentes de forma consciente.
      </p>

      <h2>10. Mudanças nesta política</h2>
      <p>
        Se mudarmos algo relevante, avisamos por e-mail e atualizamos a data no
        topo desta página.
      </p>
    </>
  );
}
