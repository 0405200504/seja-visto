import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Regras de uso da plataforma Manual Prático do Outfit: acesso, conteúdo, comunidade e responsabilidades.",
};

export default function TermosPage() {
  return (
    <>
      <h1>Termos de Uso</h1>
      <p className="atualizado">Última atualização: 28 de julho de 2026</p>

      <p>
        Ao comprar ou usar o Manual Prático do Outfit, você concorda com estes
        termos. Eles valem junto com a{" "}
        <a href="/privacidade">Política de Privacidade</a> e a{" "}
        <a href="/reembolso">Política de Reembolso</a>.
      </p>

      <h2>1. O que você está comprando</h2>
      <p>
        O Manual Prático do Outfit é um produto digital de educação em estilo
        masculino. O acesso inclui, conforme o plano adquirido: as aulas do
        método, o acervo de combinações, os guias, os estilos, o glossário, o
        plano de ação, a área de guarda-roupa, a comunidade de fits e o Fit
        Check (consultor de estilo com inteligência artificial).
      </p>
      <p>
        É conteúdo educacional e de orientação estética.{" "}
        <strong>Não garantimos resultado específico</strong> — o que você
        alcança depende de como aplica o material.
      </p>

      <h2>2. Acesso e conta</h2>
      <ul>
        <li>
          O acesso é <strong>pessoal e intransferível</strong>. Uma conta, uma
          pessoa.
        </li>
        <li>
          Você é responsável por manter sua senha em segurança. Não compartilhe
          seu login.
        </li>
        <li>
          A duração do acesso é a do plano que você comprou: 30 dias, 1 ano ou
          vitalício. O prazo aparece na sua área de perfil.
        </li>
        <li>
          Detectando compartilhamento de conta ou acesso simultâneo incompatível
          com uso individual, podemos suspender a conta. Antes disso, entramos
          em contato.
        </li>
      </ul>

      <h2>3. Propriedade do conteúdo</h2>
      <p>
        Todo o conteúdo da plataforma — textos, aulas, fotos, combinações,
        guias, identidade visual — é protegido por direitos autorais.
      </p>
      <p>
        <strong>Você pode:</strong> consultar, estudar e aplicar o conteúdo na
        sua vida, quantas vezes quiser, enquanto tiver acesso.
      </p>
      <p>
        <strong>Você não pode:</strong> copiar, revender, redistribuir, publicar
        em outro lugar, gravar e repassar, usar para criar produto concorrente
        ou dar acesso a terceiros. Violação encerra o acesso sem reembolso, além
        das medidas cabíveis.
      </p>

      <h2>4. Comunidade de fits</h2>
      <p>
        Ao enviar uma foto para a comunidade, você declara que a imagem é sua ou
        que tem autorização de quem aparece nela, e autoriza a exibição dela
        para os demais alunos dentro da plataforma.
      </p>
      <p>
        Toda foto passa por moderação antes de aparecer. Recusamos, sem
        necessidade de justificativa detalhada, imagens com nudez ou conteúdo
        sexual, violência, discurso de ódio, discriminação, dados pessoais de
        terceiros, propaganda ou qualquer coisa ilegal.
      </p>
      <p>
        Você pode apagar suas fotos a qualquer momento, e isso remove a imagem
        do armazenamento.
      </p>
      <p>
        Nos comentários vale a mesma régua: crítica de estilo é bem-vinda,
        ataque pessoal não. Contas que ofendem outros alunos são suspensas.
      </p>

      <h2>5. Fit Check e inteligência artificial</h2>
      <p>
        O Fit Check usa inteligência artificial para analisar fotos e responder
        dúvidas de estilo. Você precisa saber que:
      </p>
      <ul>
        <li>
          As respostas são <strong>sugestões de estilo</strong>, geradas
          automaticamente. Podem conter erros, e não substituem seu julgamento.
        </li>
        <li>
          Sua foto é enviada para a OpenAI para ser analisada. Detalhes no item
          4 da <a href="/privacidade">Política de Privacidade</a>.
        </li>
        <li>
          Análise de imagem consome tokens. Cada conta recebe uma quantidade
          inicial gratuita; depois é preciso comprar um pacote. Os pacotes têm
          validade de 30 dias a partir da compra.
        </li>
        <li>
          Envie apenas fotos suas ou de peças de roupa. É proibido enviar imagem
          de terceiros sem autorização, conteúdo íntimo ou qualquer coisa
          ilegal.
        </li>
        <li>
          Há limites de uso por dia e por hora, para manter o serviço no ar para
          todos. Uso automatizado, revenda do acesso à IA ou tentativa de
          desviar a ferramenta da sua finalidade encerram a conta.
        </li>
      </ul>

      <h2>6. Pagamento</h2>
      <p>
        Os pagamentos são processados pela Cakto. Não temos acesso aos dados do
        seu cartão. Os preços vigentes são os anunciados na página de vendas no
        momento da compra.
      </p>
      <p>
        Sobre devolução, prazo e direito de arrependimento, veja a{" "}
        <a href="/reembolso">Política de Reembolso</a>.
      </p>

      <h2>7. Disponibilidade</h2>
      <p>
        Trabalhamos para manter a plataforma no ar, mas não prometemos
        funcionamento ininterrupto. Pode haver indisponibilidade por manutenção,
        falha de fornecedor ou causas fora do nosso controle. Interrupções
        prolongadas e relevantes são compensadas com extensão do prazo de
        acesso.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        O conteúdo é orientação estética. Decisões de compra de roupa e de
        imagem pessoal são suas. Não respondemos por insatisfação com peças que
        você comprou por conta própria, nem por resultados subjetivos.
      </p>
      <p>
        Nada aqui afasta os direitos que o Código de Defesa do Consumidor
        garante a você.
      </p>

      <h2>9. Encerramento</h2>
      <p>
        Você pode encerrar sua conta quando quiser, pedindo por e-mail. Podemos
        encerrar o acesso, sem reembolso, em caso de violação destes termos —
        especialmente pirataria de conteúdo, compartilhamento de conta ou
        agressão a outros alunos.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Podemos atualizar estes termos. Mudanças relevantes são avisadas por
        e-mail com pelo menos 15 dias de antecedência. Continuar usando a
        plataforma depois disso significa concordar com a nova versão.
      </p>

      <h2>11. Foro e contato</h2>
      <p>
        Estes termos são regidos pelas leis brasileiras. Fica eleito o foro do
        domicílio do consumidor para resolver qualquer disputa.
      </p>
      <p>
        Contato:{" "}
        <a href="mailto:equipe@manualpraticodooutfit.com.br">
          equipe@manualpraticodooutfit.com.br
        </a>
        .
      </p>
    </>
  );
}
