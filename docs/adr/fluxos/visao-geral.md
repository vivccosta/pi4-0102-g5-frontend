# A lista/tabela de módulos

| Módulo | O que faz | Tecnologia | Repositório | Responsável |
| ------ | --------- | ---------- | ----------- | ----------- |
| Frontend | Fornece as telas de consulta pública de certificados e a área de gestão/histórico para os emissores formalizados. | React (TypeScript) | pi4-0102-g5-frontend | Viviane Conceição Costa | 
| Backend 1 (API) | Centraliza as regras de negócio, controle de acesso de emissores (CNPJ/MEI), rotas de API e gerenciamento das requisições de validação. | Java (Spring Boot) | pi4-0102-g5-backend-1 | Emely Miguel Moreira | 
| Backend 2 (Blockchain) | Atua como o motor isolado da blockchain, responsável por calcular o SHA-256, encadear os blocos e garantir a integridade dos registros. | Python (FastAPI) | pi4-0102-g5-backend-2 | Caio Lucena Andrade |
| Banco de Dados | Armazena os cadastros de emissores, metadados dos certificados, histórico e os dados persistidos da aplicação. | MongoDB | Junto ao pi4-0102-g5-backend-1 | Gabriel Biazon Galeazzi |



# O diagrama de contêineres

flowchart TB
    emissor(["Emissor formalizado"])
    verificador(["Verificador público"])
    subgraph timbro ["Sistema Timbro"]
        frontend["Frontend<br/>React (TypeScript)<br/>Telas de consulta pública e painel de gestão"]
        backend1["Backend 1 (API)<br/>Java (Spring Boot)<br/>Regras de negócio, controle de acesso e rotas"]
        backend2["Backend 2 (Blockchain)<br/>Python (FastAPI)<br/>Motor blockchain, SHA-256 e integridade"]
        banco[("Banco de Dados<br/>MongoDB<br/>Cadastros, metadados e histórico")]
    end
    emissor -->|usa| frontend
    verificador -->|usa| frontend
    frontend -->|"operações, WebSocket"| backend1
    backend1 -->|"atualizações, WebSocket"| frontend
    backend1 -->|"lê e grava, NoSQL"| banco
    backend1 -->|"registra bloco, WebSocket"| backend2
    backend2 -->|"retorna hash e confirmação de existência de certificado"| backend1



# A convenção de nomes

“Nas mensagens JSON trocadas via WebSocket e nas propriedades do Frontend/Backends usamos camelCase (certificadoId, chaveAutenticacao). No banco de dados MongoDB, utilizamos camelCase nos campos dos documentos (certificadoId, dataEmissao). O nome das operações (métodos e rotas) segue o padrão de verbo no infinitivo mais o objeto (emitirCertificado, validarCertificado). O nome das mensagens de aviso/eventos via WebSocket utiliza o objeto mais o que aconteceu (certificadoRegistrado, blocoEncadeado).”