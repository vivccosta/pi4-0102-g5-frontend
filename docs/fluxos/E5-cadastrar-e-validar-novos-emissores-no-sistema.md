# Fluxo do E5: Cadastrar e validar novos emissores no sistema

**Feito quando (da Entrega 1):** O administrador do sistema faz a análise da documentação de uma instituição/MEI e o perfil do emissor é ativado para uso na plataforma.

**Passos:**
- O Administrador acessa a lista de emissores pendentes e clica em “Aprovar” em um cadastrado.
- O Frontend chama o Backend 1 com a operação `ativarEmissor` (CT17).
- O Backend 1 atualiza o status desse usuário para “ativo” na coleção de emissores no Banco de Dados com a operação `emissores` (CT18).
- O Banco de Dados confirma a gravação do novo status para o Backend 1.
- O Backend 1 responde ao Frontend com mensagem de sucesso.
- O Frontend exibe na tela a mensagem “Emissor ativado com sucesso” para o Administrador.

**Diagrama:**
```mermaid
sequenceDiagram
    actor Administrador
    participant Frontend
    participant Backend1 as Backend 1
    participant Banco as Banco de Dados
    Administrador->>Frontend: clica em "Aprovar" cadastro
    Frontend->>Backend1: CT17 ativarEmissor
    Backend1->>Banco: CT18 emissores
    Banco-->>Backend1: confirmação de alteração
    Backend1-->>Frontend: resposta do CT17 com sucesso
    Frontend-->>Administrador: exibe mensagem de sucesso
```

**Contratos usados:**
- CT17 ativarEmissor
- CT18 coleOEmissores