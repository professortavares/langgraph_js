/**
 * Sample documents for RAG demonstration.
 * These documents cover a fictional company's policies and procedures.
 * Each document contains: id, title, and content.
 * Content is embedded and stored in Qdrant for semantic search.
 * @type {Array<{id: string, title: string, content: string}>}
 */
export const SAMPLE_DOCUMENTS = [
  {
    id: "doc_001",
    title: "Política de Reembolso",
    content: `A Acme Corporation oferece uma política de reembolso de 30 dias. Qualquer cliente pode solicitar um reembolso total dentro de 30 dias após a compra, sem fazer perguntas. Para solicitar um reembolso, entre em contato com nosso departamento de atendimento ao cliente através do email support@acme.com ou ligue para 1-800-ACME-HELP. O reembolso será processado dentro de 5-7 dias úteis após a aprovação.`,
  },
  {
    id: "doc_002",
    title: "Plano de Suporte Técnico",
    content: `A Acme oferece três níveis de suporte técnico: Básico (gratuito), Profissional ($29/mês) e Premium ($99/mês). Suporte Básico inclui acesso a documentação e fórum de comunidade. Suporte Profissional oferece email prioritário e resposta dentro de 24 horas. Suporte Premium inclui suporte telefônico 24/7, chat ao vivo e dedicação de um técnico pessoal. Todos os planos incluem atualizações de software gratuitas.`,
  },
  {
    id: "doc_003",
    title: "Guia de Onboarding para Novos Usuários",
    content: `Bem-vindo à Acme! Para começar, faça login na sua conta e complete o perfil. Em seguida, explore o painel de controle e configure suas preferências. Recomendamos assistir ao vídeo de introdução de 5 minutos disponível na seção de ajuda. Para perguntas, consulte nossa base de conhecimento ou entre em contato com support@acme.com. A maioria dos usuários está produtiva em menos de 30 minutos.`,
  },
  {
    id: "doc_004",
    title: "Política de Segurança e Privacidade",
    content: `A Acme utiliza criptografia AES-256 para todos os dados em repouso e TLS 1.3 para dados em trânsito. Realiza auditorias de segurança trimestrais com terceiros. Dados pessoais não são compartilhados com terceiros sem consentimento explícito. Todos os servidores estão localizados em datacenters certificados ISO 27001 nos EUA. Você pode baixar seus dados a qualquer momento através das configurações de privacidade.`,
  },
  {
    id: "doc_005",
    title: "FAQ de Pagamentos",
    content: `Aceitamos cartões de crédito (Visa, Mastercard, American Express), PayPal, transferência bancária e criptomoedas. A maioria dos pagamentos é processada instantaneamente. Oferecemos planos anuais com 20% de desconto. Mudanças no método de pagamento podem ser feitas a qualquer momento nas configurações de cobrança. Reembolsos são processados no método de pagamento original. Se você encontrar uma cobrança indevida, avise-nos dentro de 60 dias.`,
  },
  {
    id: "doc_006",
    title: "Manual do Produto",
    content: `O produto Acme é disponível em versão cloud e on-premise. A versão cloud é acessível via app.acme.com e requer apenas um navegador moderno. A versão on-premise pode ser instalada em seus servidores e oferece total controle. Ambas as versões incluem todos os recursos principais: automação, relatórios, integração com APIs e mais. As atualizações são automáticas para versão cloud e bimestrais para on-premise.`,
  },
  {
    id: "doc_007",
    title: "Termos de Serviço",
    content: `Ao usar a Acme, você concorda com nossos termos de serviço. A responsabilidade máxima é limitada ao valor pago nos últimos 12 meses. O serviço é fornecido "como está" sem garantias de disponibilidade ininterrupta. A Acme se reserva o direito de modificar os termos com aviso de 30 dias. Você pode cancelar sua conta a qualquer momento e conservará seus dados por 30 dias após o cancelamento.`,
  },
];
