# Integração do frontend com o Backend 1

Card: OP#1372 · Branch: `fix/integracao-backend`

## Estado da validação

Validação HTTP real: **bloqueada: backend não sobe**. Não foi fornecida URL porque o Backend 1 não compila. O código informado para `main` (`2955243`) contém erros em `AutoController`/`AuthController`, `RegistroCertificadoRespondeDTO`, `Comunicado.java` (import antes do `package`), `idRequisicao` (uso antes da declaração) e `emissorRepository` (não declarado). Nenhuma chamada real foi executada.

## Divergências e observações

| Operação | Esperado (contrato) | Observado (Backend 1 real/código informado) | Quem precisa ajustar |
|---|---|---|---|
| Login | `POST /api/auth/login`; resposta `{token,nome,perfil}` | O `id` numérico do emissor vem no payload JWT; login em execução pendente | Frontend ajustado para normalizar `id` numérico. Emely: corrigir compilação e disponibilizar backend para validação |
| Rotas protegidas | Sem sessão válida, redirecionar ao login; Spring pode responder 403 sem corpo | Teste real pendente; frontend já trata 401 e 403 sem mensagem como sessão inválida | Emely: validar comportamento após corrigir compilação |
| Registro de certificado | CT4 documenta `hash` na entrada; contrato vigente no frontend envia dados e token no Bearer | Frontend envia Bearer e não inclui token no corpo; observação real do corpo/tempo/chave pendente | Emely e Caio: alinhar CT4 ao payload efetivamente aceito |
| Verificação pública | CT14 documenta `status`; contrato frontend espera `valido`; inválido em 200 ou 404 | Backend pode serializar campos DTO ausentes como `null`; resposta real pendente | Frontend aceita `valido`/`status` e campos nulos. Emely: alinhar CT14 e confirmar resposta real |
| Listagem de certificados | CT15 documenta wrapper `certificados` e omite `certificadoId`; frontend espera array com id | Código Java informado usa `Integer` para `certificadoId`; resposta real pendente | Frontend aceita array ou wrapper e id opcional. Emely: confirmar formato efetivamente servido |
| Revogação | `POST /api/certificados/{id}/revogar` | Resultado na lista e verificação pública pendente; requer backend e blockchain ativos | Emely/Caio: validar integração depois de backend iniciar |
| Listagem de emissores pendentes | CT17 e documentação usam formatos divergentes; backend alterou `cnpjCpf` para `cnpj` | DTO informado usa `Integer` para `emissorId` e campo `cnpj`; documentação real pendente | Frontend aceita ids numéricos e os dois nomes de campo. Emely/Gabriel: confirmar campo de documentação |
| Aprovação de emissor | CT17 documenta PATCH e JSON; implementação conhecida usa PUT, `{novoStatus:"ATIVO"}` e texto puro | Resultado real pendente | Frontend segue PUT/texto puro. Emely: alinhar documentação CT17 à implementação |
| Cadastro público de emissor | `POST /api/emissores/cadastrar` com `{nome,email,cnpj,senha}`; CNPJ com 14 dígitos | Backend renomeou `cnpjCpf` para `cnpj`; retorno texto puro 201 | Frontend envia CNPJ e aceita texto de sucesso variável |
| CORS e indisponibilidade | Origem do frontend autorizada; backend desligado não pode resultar em certificado inválido | Teste real pendente da URL e execução do backend | Emely: confirmar origens CORS usadas no ambiente de integração |
| Docker | Repetir login, registro e verificação no frontend servido na porta 3000 | Teste pendente; depende do compose do Backend 1 estar funcional | Emely: disponibilizar compose funcional e URL alcançável pelo navegador |

## Roteiro de integração

Resultado de cada passo no ambiente real:

1. Login com emissor ativo, pendente, senha incorreta e administrador — **bloqueado: backend não sobe**.
2. Rotas protegidas sem token e com token adulterado/expirado — **bloqueado: backend não sobe**.
3. Registro, corpo enviado, duração e chave devolvida — **bloqueado: backend não sobe**.
4. Verificação da chave emitida, inexistente e revogada — **bloqueado: backend não sobe**.
5. Listagem de certificados, `curso`, formato de `dataEmissao` e status — **bloqueado: backend não sobe**.
6. Revogação e conferência no painel/verificação — **bloqueado: backend não sobe**.
7. Listagem de pendentes, documentação, aprovação e novo login — **bloqueado: backend não sobe**.
8. CORS no navegador — **bloqueado: backend não sobe**. A indisponibilidade será coberta pelos testes automatizados; não foi possível conferir no navegador.
9. Frontend Docker na porta 3000 com compose do Backend 1 — **bloqueado: backend não sobe**.

## Pedidos ao time

- **Emely:** corrigir os erros de compilação listados acima; disponibilizar Backend 1 executável; confirmar/alinhar CT14 (`status`/`valido`), CT15 (array/wrapper e `certificadoId`) e CT17 (PUT/body/texto puro versus documentação), além de informar as origens CORS do ambiente.
- **Caio:** validar registro, verificação e revogação com Backend 2 ativo após o Backend 1 compilar; alinhar CT4, que documenta `hash` na entrada.
- **Gabriel:** confirmar onde ficam os documentos dos emissores e como o Backend 1 poderá incluí-los na resposta de pendentes, caso o requisito permaneça.
