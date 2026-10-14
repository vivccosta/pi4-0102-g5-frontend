Fluxo do E3: 

Feito quando (da Entrega 1): Qualquer pessoa faz a inserção da chave de autenticação na interface e o sistema exibe o status e a veracidade do certificado. 

O usuário escolhe a forma de verificação (número de série ou PDF), insere os dados e clica em *"Verificar certificado"*.   

O Frontend envia a requisição para o Backend 1 com a operação `validarCertificado` (CT9).  

Cenário A — Validação via PDF: 

3.1. O Backend 1 gera o hash do arquivo PDF recebido.  

3.2. O Backend 1 consulta o Backend 2 (Blockchain) com a operação `consultarHashBlockchain` (CT10).  

3.3. O Backend 2 (Blockchain) retorna se o registro existe e os dados armazenados (CT11). 

Cenário B — Validação via Número de Série: 

 4.1. O Backend 1 consulta a chave diretamente no Banco de Dados (CT12).  

 4.2. O Banco de Dados retorna o registro encontrado ou vazio (CT13).  

O Backend 1 responde ao Frontend com o status e metadados (CT14).  

O Frontend exibe:  

- Se válido: "Certificado válido" e os metadados. 

 - Se inválido: "Certificado inválido". 

Diagrama:
```mermaid
sequenceDiagram
    actor Usuario as Usuário
    participant Frontend
    participant Backend1 as Backend 1 (API)
    participant Backend2 as Backend 2 (Blockchain)
    participant Banco as Banco de Dados

    Usuario->>Frontend: Insere chave ou anexa PDF e clica em "Verificar"
    Frontend->>Backend1: CT9 validarCertificado
    
    alt Validação via PDF
        Note over Backend1: Gera hash a partir do arquivo PDF
        Backend1->>Backend2: CT10 consultarHash
        Backend2-->>Backend1: CT11 retornoConsultaBlockchain
    else Validação via Número de Série / Chave
        Backend1->>Banco: CT12 consultarCertificadoBanco
        Banco-->>Backend1: CT13 retornoConsultaBanco
    end
    
    alt Certificado Válido
        Backend1-->>Frontend: CT14 respostaValidacaoCertificado (valido)
        Frontend-->>Usuario: Exibe "Certificado válido" e dados
    else Certificado Inválido
        Backend1-->>Frontend: CT14 respostaValidacaoCertificado (invalido)
        Frontend-->>Usuario: Exibe "Certificado inválido"
    end