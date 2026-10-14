Fluxo do E1:
 
Feito quando (da Entrega 1): Um usuário não autorizado (ex: aluno) faz a tentativa de acessar a área de emissão e o sistema bloqueia o acesso, permitindo apenas emissores. 

Passos: 
1.	O usuário não autorizado acessa a tela de login da área de emissão e insere credenciais (email e senha).
2.	O Frontend chama o Backend 1 com a operação autenticarEmissor (CT1).
3.	O Backend 1 consulta na tabela de emissores cadastrados se o usuário existe e se as credenciais conferem (CT2).
4.	O Banco de dados responde que o registro não foi encontrado / credenciais não conferem.
5.	O Backend 1 valida o retorno e responde ao Frontend com erro de acesso não autorizado (CT3).
6.	O Frontend exibe a mensagem de bloqueio: "Acesso não autorizado. Apenas emissores cadastrados podem acessar esta área."

Diagrama:

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário Não Autorizado (Aluno)
    participant F as Frontend
    participant B as Backend 1
    participant DB as Banco de Dados

    U->>F: Insere credenciais na tela de login de emissão
    F->>B: autenticarEmissor(usuario, senha) [CT1]
    B->>DB: Consulta credenciais na tabela de emissores [CT2]
    DB-->>B: Retorna registro não encontrado
    Note over B: Valida inexistência de cadastro de emissor
    B-->>F: Resposta de erro: Acesso não autorizado (401/403) [CT3]
    F->>U: Exibe mensagem: "Acesso não autorizado. Apenas emissores permitidos."
