Crie um projeto completo em JavaScript/Node.js demonstrando um RAG simples usando LangGraph.js, Qdrant e OpenAI.

Objetivo:
Quero um exemplo mínimo, didático e executável via Docker/Docker Compose que faça:

1. Subir um Qdrant local via docker-compose.
2. Inicializar uma aplicação Node.js.
3. Criar uma coleção no Qdrant.
4. Inserir alguns documentos fictícios no banco vetorial.
5. Receber uma pergunta.
6. Executar um grafo LangGraph.
7. Ter um nó do grafo responsável por recuperar documentos relevantes no Qdrant.
8. Ter outro nó responsável por chamar uma LLM da OpenAI e montar uma resposta usando os documentos recuperados.
9. Mostrar o resultado completo no console.

Stack obrigatória:
- Node.js com JavaScript moderno, preferencialmente ESM.
- LangGraph.js, usando @langchain/langgraph.
- Qdrant local via Docker.
- Cliente JavaScript/TypeScript oficial ou REST do Qdrant.
- OpenAI SDK oficial para Node.js.
- Docker e docker-compose.

Estrutura esperada do projeto:

.
├── docker-compose.yml
├── Dockerfile
├── package.json
├── .env.example
├── README.md
└── src
    ├── index.js
    ├── qdrant.js
    ├── seed.js
    ├── graph.js
    ├── openai.js
    └── documents.js

Requisitos funcionais:

1. docker-compose.yml
   - Deve subir dois serviços:
     - app: aplicação Node.js
     - qdrant: banco vetorial local
   - O Qdrant deve expor a porta 6333.
   - Para manter o exemplo simples e “efêmero”, não configure volume persistente. Assim, ao recriar o container, os dados somem.
   - O app deve depender do qdrant.
   - O app deve receber OPENAI_API_KEY via variável de ambiente.

2. Documentos fictícios
   - Crie entre 5 e 8 documentos fictícios em src/documents.js.
   - Cada documento deve ter:
     - id
     - title
     - content
   - Use temas simples, por exemplo:
     - Política de reembolso de uma empresa fictícia
     - Plano de suporte
     - Guia de onboarding
     - Política de segurança
     - FAQ de pagamentos
     - Manual de produto

3. Embeddings
   - Use OpenAI embeddings para gerar vetores dos documentos.
   - Use um modelo de embedding atual da OpenAI, por exemplo text-embedding-3-small, salvo em uma constante para fácil alteração.
   - Garanta que o tamanho do vetor usado na criação da coleção Qdrant seja compatível com o modelo.
   - Crie uma função embedText(text) em src/openai.js.

4. Qdrant
   - Em src/qdrant.js, crie funções:
     - getQdrantClient()
     - recreateCollection()
     - upsertDocuments(documentsWithVectors)
     - searchSimilar(vector, limit)
   - A coleção pode se chamar demo_rag_documents.
   - A distância pode ser Cosine.
   - Os payloads no Qdrant devem conter title e content.
   - O código deve esperar o Qdrant estar disponível antes de tentar criar a coleção, com retries simples.

5. Seed
   - Em src/seed.js, crie uma função seedDocuments().
   - Essa função deve:
     - recriar a coleção
     - gerar embeddings para os documentos fictícios
     - inserir os pontos no Qdrant
   - A aplicação pode chamar o seed no início de cada execução para manter o exemplo determinístico.

6. LangGraph
   - Em src/graph.js, crie um grafo usando StateGraph.
   - O estado do grafo deve conter pelo menos:
     - question
     - retrievedDocs
     - answer
   - Crie pelo menos dois nós:
     - retrieve: gera embedding da pergunta e busca documentos similares no Qdrant
     - generateAnswer: monta um prompt com a pergunta e os documentos recuperados e chama a LLM da OpenAI
   - O fluxo deve ser:
     START -> retrieve -> generateAnswer -> END
   - O nó retrieve deve salvar no estado uma lista com:
     - title
     - content
     - score
   - O nó generateAnswer deve instruir a LLM a responder somente com base nos documentos recuperados. Se os documentos não forem suficientes, a resposta deve dizer isso claramente.
   - Exporte uma função runRagGraph(question).

7. OpenAI LLM
   - Em src/openai.js, além de embedText(), crie generateAnswerWithOpenAI({ question, retrievedDocs }).
   - Use o SDK oficial da OpenAI.
   - Use uma chamada simples de geração de texto.
   - O modelo deve estar em uma constante, por exemplo:
     - LLM_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"
     - EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
   - A resposta deve ser texto simples.

8. Execução principal
   - Em src/index.js:
     - carregue variáveis de ambiente
     - rode seedDocuments()
     - leia uma pergunta de process.argv ou use uma pergunta padrão
     - execute runRagGraph(question)
     - imprima no console:
       - pergunta
       - documentos recuperados, com título e score
       - resposta final
   - Exemplo de uso:
     npm start -- "Qual é a política de reembolso?"

9. package.json
   - Scripts:
     - "start": "node src/index.js"
     - "dev": "node --watch src/index.js"
   - Dependências necessárias:
     - @langchain/langgraph
     - @qdrant/js-client-rest ou @qdrant/qdrant-js
     - openai
     - dotenv

10. README.md
   - Explique:
     - como configurar .env
     - como rodar com docker compose
     - como passar uma pergunta
     - exemplo de saída esperada no console
   - Inclua comandos:
     cp .env.example .env
     docker compose up --build
     docker compose run --rm app npm start -- "Qual é a política de reembolso?"
   - Explique brevemente o fluxo:
     pergunta -> embedding -> busca Qdrant -> documentos -> LLM -> resposta

11. .env.example
   - Deve conter:
     OPENAI_API_KEY=coloque_sua_chave_aqui
     OPENAI_MODEL=gpt-4.1-mini
     OPENAI_EMBEDDING_MODEL=text-embedding-3-small
     QDRANT_URL=http://qdrant:6333

12. Qualidade do código
   - Código simples e legível.
   - Use async/await.
   - Trate erros principais.
   - Não use TypeScript; faça em JavaScript puro.
   - Comente apenas onde for útil.
   - Evite abstrações excessivas.
   - O projeto deve funcionar com Node 20 ou superior.

13. Saída esperada no console
   - A saída deve ser amigável e demonstrativa.
   - Exemplo:

   Pergunta:
   Qual é a política de reembolso?

   Documentos recuperados:
   1. Política de Reembolso Acme — score: 0.87
   2. FAQ de Pagamentos — score: 0.74
   3. Termos Comerciais — score: 0.61

   Resposta:
   Com base nos documentos recuperados, a Acme permite reembolso em até 30 dias...

Importante:
- Não implemente uma API HTTP nem interface web.
- Não use banco persistente.
- O objetivo é uma demo RAG local, executável e fácil de explicar.
- Garanta que todos os arquivos necessários sejam criados.
- Ao final, mostre a árvore de arquivos e instruções exatas de execução.