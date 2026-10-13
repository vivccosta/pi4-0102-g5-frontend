**Fluxo do E7**: Disponibilizar emissão de comprovante digital (PDF)

**Feito quando (da Entrega 1)**: O usuário da consulta pública faz a validação bem-sucedida de uma chave autêntica e o sistema disponibiliza um comprovante de veracidade para download.

**Passos**
- O verificador público insere a chave de autenticação ou envia o arquivo PDF do certificado na interface de consulta pública.
- O Frontend envia a requisição de validação via WebSocket para o Backend 1 (API).
- O Backend 1 repassa a solicitação e os dados do certificado/arquivo via WebSocket para o Backend 2 (Blockchain).
- O Backend 2 (Blockchain) processa o binário do certificado, calcula/confere o hash SHA-256 e valida a existência e integridade do registro na blockchain.
- O Backend 2 retorna a confirmação de validade e a evidência criptográfica para o Backend 1 via WebSocket.
- O Backend 1 consulta os metadados complementares no Banco de Dados e gera o arquivo do comprovante de veracidade.
- O Backend 1 responde ao Frontend com os dados validados e o arquivo do comprovante.
- O Frontend exibe a confirmação de autenticidade e disponibiliza o comprovante digital para download pelo verificador público.


**Diagrama**

sequenceDiagram
    actor Verificador as Verificador público
    participant Frontend
    participant Backend1 as Backend 1 (API)
    participant Backend2 as Backend 2 (Blockchain)
    participant Banco
    Verificador->>Frontend: envia o PDF / insere a chave para validação
    Frontend->>Backend1: CT1 validarCertificado
    Backend1->>Backend2: CT2 consultarBlocoEHash
    Backend2->>Backend2: valida hash SHA-256 na blockchain
    Backend2-->>Backend1: CT3 confirmacaoIntegridade
    Backend1->>Banco: CT4 consultarMetadados
    Banco-->>Backend1: dados complementares
    Backend1->>Backend1: gera PDF do comprovante
    Backend1-->>Frontend: CT5 comprovanteVeracidade
    Frontend-->>Verificador: disponibiliza o comprovante digital para download


**Contratos usados:**
- CT1 validarCertificado
- CT2 consultarBlocoEHash
- CT3 confirmacaoIntegridade
- CT4 consultarMetadados
- CT5 comprovanteVeracidade