<div align="center">

<img src="public/icon-192.svg" width="96" alt="Monetta" />

# Monetta

**Controle financeiro pessoal — offline, bonito e sem complicação.**

![Versão](https://img.shields.io/badge/versão-1.0-635BFF?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-instalável-10B981?style=flat-square)
![Offline](https://img.shields.io/badge/offline-first-10B981?style=flat-square)
![License](https://img.shields.io/badge/licença-MIT-94A3B8?style=flat-square)

[**Abrir o app →**](https://daviidvl.github.io/Monetta/)

</div>

---

## O que é

Monetta é um app de finanças pessoais construído para quem quer clareza sobre o próprio dinheiro — sem bancos, sem nuvem, sem cadastro. Tudo roda no seu navegador e os dados ficam no seu dispositivo.

Foi criado para substituir a planilha: mais rápido de usar, com visual limpo e inteligência suficiente para te dizer quando está sobrando dinheiro e onde ele está indo.

---

## Funcionalidades

**Visão geral do mês**
Saldo previsto, orçamento em forma de anel (despesas × investimentos × livre), e um card de sugestão que aparece quando sobra dinheiro — indicando quanto você poderia guardar ou investir.

**Contas**
Cadastre contas fixas, parcelamentos e despesas avulsas. Marque como pago pelo celular em segundos. A aba "Pagas" organiza tudo por mês automaticamente, e no início de cada mês as contas recorrentes voltam para pendente — sem precisar fazer nada.

**Renda variável**
Seu salário base fica salvo, mas você pode editar a qualquer momento. Adicione entradas extras (bônus, freelance, férias, 13º) e o app recalcula tudo: saldo livre, insights e sugestões.

**Investimentos**
Registre qualquer tipo de ativo: renda fixa, ações, FIIs, cripto. Para criptomoedas, informe a data e hora exata da compra e o app busca o preço histórico naquele momento. O valor total da carteira atualiza em tempo real conforme a volatilidade do mercado, com P&L em verde ou vermelho.

**Metas**
Defina objetivos com valor-alvo e acompanhe o progresso. A Monetta sugere quanto destinar para sua meta quando você tem dinheiro sobrando no mês.

**Insights e dicas**
Análises automáticas baseadas nos seus dados — percentual comprometido, parcelas quase quitadas, relação investimentos × renda. Mais uma dica financeira diferente todo dia.

**Histórico**
Todo pagamento fica registrado. Você pode ver o quanto pagou em cada mês, navegar pelo histórico e entender seus padrões ao longo do tempo.

---

## Tecnologia

Monetta é um PWA — pode ser instalado como app no celular e funciona sem internet. Nenhum dado sai do seu dispositivo.

| Camada | Escolha |
|---|---|
| Interface | React 18 + TypeScript |
| Estilo | Tailwind CSS + design tokens |
| Animações | Framer Motion |
| Dados | IndexedDB via Dexie (local, offline) |
| Estado | Zustand |
| Preços crypto | CoinGecko API (gratuita, sem autenticação) |
| Deploy | GitHub Pages |

---

## Design

Visual inspirado em Linear, Stripe e Apple — sem poluição visual, hierarquia clara, dark mode, e animações sutis que tornam a experiência agradável de usar.

---
