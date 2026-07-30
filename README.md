<div align="center">

<img src="public/icon-192.svg" width="96" alt="Monetta" />

# Monetta

**Controle financeiro pessoal — sincronizado, bonito e sem complicação.**

![Versão](https://img.shields.io/badge/versão-1.0-635BFF?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-instalável-10B981?style=flat-square)
![Sync](https://img.shields.io/badge/multi--dispositivo-Supabase-10B981?style=flat-square)
![License](https://img.shields.io/badge/licença-MIT-94A3B8?style=flat-square)

[**Abrir o app →**](https://monetta.vercel.app)

</div>

---

## O que é

Monetta é um app de finanças pessoais construído para quem quer clareza sobre o próprio dinheiro. Login com email/senha sincroniza os mesmos dados entre celular e computador via Supabase — sem planilha, sem fricção.

Foi criado para substituir a planilha: mais rápido de usar, com visual limpo e inteligência suficiente para te dizer quando está sobrando dinheiro e onde ele está indo.

---

## Funcionalidades

**Visão geral do mês**
Saldo previsto, orçamento em forma de anel (despesas × investimentos × livre), e um card de sugestão que aparece quando sobra dinheiro — indicando quanto você poderia guardar ou investir.

**Contas**
Cadastre contas fixas e parcelamentos. Marque como pago pelo celular em segundos. A aba "Pagas" organiza tudo por mês automaticamente, e a cada novo ciclo as contas recorrentes voltam para pendente — sem precisar fazer nada.

**Gastos do dia a dia**
Registre despesas avulsas (comida, transporte, saúde, compras, lazer...) por categoria, agrupadas por dia, separadas das contas fixas.

**Renda variável**
Seu salário base fica salvo, mas você pode editar a qualquer momento. Adicione entradas extras (bônus, freelance, férias, 13º) e o app recalcula tudo: saldo livre, insights e sugestões.

**Investimentos**
Registre qualquer tipo de ativo: poupança, renda fixa (Tesouro, CDB), ações, FIIs, cripto ou outros. Para criptomoedas, informe a data e hora exata da compra e o app busca o preço histórico naquele momento. O valor total da carteira atualiza em tempo real conforme a volatilidade do mercado, com P&L em verde ou vermelho.

**Metas**
Defina objetivos com valor-alvo e acompanhe o progresso. A Monetta sugere quanto destinar para sua meta quando você tem dinheiro sobrando no mês.

**Calendário**
Visão mensal com indicadores visuais de vencimentos, pra nunca ser pego de surpresa.

**Insights e dicas**
Análises automáticas baseadas nos seus dados — percentual comprometido, parcelas quase quitadas, relação investimentos × renda. Mais uma dica financeira diferente todo dia.

**Perfil e conta**
Edite seus dados (nome, renda, dia de pagamento, objetivo), faça logout ou apague sua conta e todos os dados permanentemente, direto pelo app.

**Backup**
Exporte ou importe todos os seus dados em JSON a qualquer momento.

---

## Tecnologia

Monetta é um PWA — pode ser instalado como app no celular. Login com email/senha sincroniza os mesmos dados entre celular e computador via Supabase.

| Camada | Escolha |
|---|---|
| Interface | React 18 + TypeScript + Vite 5 |
| Estilo | Tailwind CSS + design tokens |
| Animações | Framer Motion |
| Dados | Supabase (Postgres + Auth), cache/estado via TanStack Query |
| Estado | Zustand |
| Preços crypto | CoinGecko API (gratuita, sem autenticação) |
| Deploy | Vercel (PWA + `/api` serverless functions) |

---

## Design

Visual inspirado em Linear, Stripe e Apple — minimalismo premium com glassmorphism sutil, hierarquia clara, dark mode com undertone roxo, e animações sutis que tornam a experiência agradável de usar.

---
