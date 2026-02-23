<div align="center">
  <img src="https://img.icons8.com/color/120/000000/rose.png" alt="Logo SERVAS">
  <h1>🌹 SERVAS - Santuário Diocesano Nossa Senhora da Natividade</h1>
  <p><strong>Sistema de Gestão de Escalas e Engajamento de Servas</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-7-purple?style=flat-square&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js" alt="Express" />
    <img src="https://img.shields.io/badge/Prisma-ORM-black?style=flat-square&logo=prisma" alt="Prisma" />
  </p>
</div>

---

## 📖 Sobre o Projeto
**SERVAS** é uma plataforma moderna e completa desenvolvida para automatizar e encorajar as escalas de missas das Servas do Santuário Diocesano Nossa Senhora da Natividade. 

O sistema substitui planilhas manuais e avisos soltos por uma aplicação **PWA (Progressive Web App)** intuitiva, recompensando a assiduidade através de um sistema de gamificação com **Rankings Mensais** e **Conquistas (Badges)**.

---

## ✨ Principais Funcionalidades

- 📆 **Gestão de Escalas Simplificada**: As servas podem visualizar as missas disponíveis no mês e se inscrever rapidamente nas vagas abertas.
- ⏳ **Sistema de Reservas**: Missas lotadas permitem a entrada em "Fila de Espera" (Reserva).
- 🔄 **Trocas e Substituições Abertas**: Se uma serva não puder comparecer, ela pode solicitar uma substituição. Outras servas são notificadas e podem assumir a vaga através de um mural em tempo real.
- 🏆 **Placar Mensal e Gamificação**: 
  - Regras de pontuação automática (ex: dias de semana valem mais pontos).
  - Celebração festiva para a "Campeã do Mês" (`Winner Modal`).
  - Coleção de *Badges* baseadas no número de presenças confirmadas.
- 🖨️ **Geração de Documentos Oficiais**: Acesso rápido a uma versão limpa da escala (PDF/Impressão) para fixação mural nas sacristias.
- 🔐 **Painel Administrativo Independente**: Controle total para administradores aprovarem usuários, criarem missas (individuais ou em massa), enviar avisos (Notices) e validarem presenças.

---

## 🛠️ Tecnologias Utilizadas

### Frontend (`/web`)
- **React 19** + **Vite**: Interface ultrarrápida e componentizada.
- **TypeScript**: Segurança tipada ponta-a-ponta.
- **TanStack Virtual**: Listas de missas virtualizadas para máximo desempenho no mobile.
- **PWA Ready**: Instalação no celular como aplicativo nativo (`vite-plugin-pwa`).
- **Sistema de Design Centralizado**: Custom Properties CSS (`theme.ts`) garantindo consistência visual da identidade.
- **React Router & Axios**: Navegação e consumo de API.

### Backend (`/server`)
- **Node.js** + **Express**: API RESTful ágil e robusta.
- **Prisma ORM**: Relacionamento robusto do banco de dados (Missas, Inscrições, Pedidos de Troca, Usuários).
- **JWT (JSON Web Tokens)**: Segurança total de rotas autenticadas e controle de acessos (Serva vs Administrador).

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18+)
- Banco de Dados (SQLite por padrão, ajustável no `.env`)

### 1. Clonando o Repositório
```bash
git clone https://github.com/fescarvalho/ServasProjeto.git
cd ServasProjeto
```

### 2. Configurando o Backend (Server)
```bash
cd server
npm install

# Configure seu arquivo .env com JWT_SECRET e DATABASE_URL
# Exemplo local (SQLite): DATABASE_URL="file:./dev.db"

# Gerar o banco e rodar as migrações/seed
npx prisma generate
npx prisma db push
npm run prisma:seed # (Se houver seeds configuradas)

# Iniciar o servidor de desenvolvimento (Roda na porta 3333 por padrão)
npm run dev
```

### 3. Configurando o Frontend (Web)
Em outro terminal:
```bash
cd web
npm install

# Configurar as variáveis .env contendo a URL da API, ex:
# VITE_API_URL=http://localhost:3333

# Rodar o cliente web
npm run dev
```
Acesse `http://localhost:5173` no navegador.

---

## 🎨 Identidade Visual (Design System)

O aplicativo foi inteiramente desenhado ao redor de Tokens de Design escaláveis, centrados nas cores do Santuário:
- **Rosa Primário (`#ff2e63`) e variações Gradientes**: Transmitem calor, afeto e energia.
- **Bordô Secundário (`#91163f`)**: Representa a sobriedade e respeito ao altar.
- **Suporte Clean**: Fundos off-white (`#f5f5f5`), bordas fluidas e sombras (`shadowBase`) trazendo a leitura de um software limpo e confiável.

---

<div align="center">
  <p>Desenvolvido com 🤍 por <a href="https://www.linkedin.com/in/fecarvalhodev/">Fernando Carvalho</a></p>
  <p><em>"Servir com alegria."</em></p>
</div>
