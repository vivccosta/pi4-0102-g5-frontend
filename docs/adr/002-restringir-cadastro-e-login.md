# ADR 0002: Restringir cadastro e login apenas para emissores
**Status: aceito**

**Contexto:** O sistema precisa garantir que apenas instituições, empresas formalizadas e MEIs possam registrar certificados, impedindo que alunos ou terceiros não autorizados emitam documentos em nome de emissores legítimos.

**Decisão:** Limitar o fluxo de cadastro, login e painel de controle exclusivamente a perfis de emissores formalizados, bloqueando qualquer tentativa de emissão por parte de alunos.

**Alternativas consideradas:**

Permitir que qualquer usuário cadastre e emita certificados livremente: descartado pois anularia a credibilidade e a autenticidade dos documentos.

Sistema aberto sem necessidade de login para emissores: descartado por falta de segurança e controle de autoria.

**Consequências:**

Positivas: Segurança jurídica e garantia de que os certificados possuem origem validada por uma empresa ou MEI.

Negativas: Aumento da burocracia inicial para o uso da plataforma devido à necessidade de validação do emissor.