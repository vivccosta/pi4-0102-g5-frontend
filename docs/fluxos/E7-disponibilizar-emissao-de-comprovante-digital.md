Fluxo do E7: Disponibilizar emissão de comprovante digital (PDF) 

Feito quando (da Entrega 1): O usuário da consulta pública faz a validação bem-sucedida de uma chave autêntica e o sistema disponibiliza um comprovante de veracidade para download. 

Passos  

O verificador público insere a chave de autenticação ou envia o arquivo PDF do certificado na interface de consulta pública. 

O Frontend envia a requisição de validação via WebSocket para o Backend 1 com a operação validarCertificado (CT9). 

O Backend 1 repassa a solicitação para o Backend 2 com a operação consultarBlocoEHash (CT27). 

O Backend 2 processa o binário do certificado, calcula/confere o hash SHA-256 e valida a integridade na blockchain. 

O Backend 2 retorna a confirmação de integridade para o Backend 1. 

O Backend 1 consulta os metadados complementares no Banco de Dados com a operação consultarMetadados (CT28). 

O Banco de Dados retorna os dados complementares do certificado para o Backend 1. 

O Backend 1 gera internamente o arquivo PDF do comprovante de veracidade. 

O Backend 1 responde ao Frontend com os dados validados e o arquivo do comprovante. 

O Frontend exibe a confirmação de autenticidade e disponibiliza o comprovante digital para download pelo verificador público. 

**Contratos usados:**
- CT1 validarCertificado
- CT2 consultarBlocoEHash
- CT4 consultarMetadados

**Diagrama**
```mermaid
sequenceDiagram
    actor Verificador as Verificador público
    participant Frontend
    participant Backend1 as Backend 1 (API)
    participant Backend2 as Backend 2 (Blockchain)
    participant Banco as Banco de Dados

    Verificador->>Frontend: insere chave ou envia PDF para validação
    Frontend->>Backend1: CT9 validarCertificado
    Backend1->>Backend2: CT27 consultarBlocoEHash
    Note over Backend2: valida hash SHA-256 na blockchain
    Backend2-->>Backend1: confirmação de integridade
    Backend1->>Banco: CT28 consultarMetadados
    Banco-->>Backend1: dados complementares do certificado
    Note over Backend1: gera o PDF do comprovante
    Backend1-->>Frontend: resposta do CT9 com o comprovante
    Frontend-->>Verificador: disponibiliza o comprovante digital para download
