# 🎨 Caio's Paint

Um editor de imagem rápido, moderno e intuitivo construído em HTML5, CSS3 e JavaScript Vanilla, desenvolvido especialmente para ser utilizado como um **WebApp de alta performance no Zorin OS (Linux)**.

🌐 **Acesse a aplicação online**: [https://kcaiooooo.github.io/caios-paint/](https://kcaiooooo.github.io/caios-paint/)

---

## 🌟 Filosofia do Projeto

O **Caio's Paint** nasce da necessidade de ter um editor de imagens rápido para o dia a dia no Linux:
- **Nem tão complexo**: Evita a curva de aprendizado íngreme e menus poluídos de softwares pesados cheios de camadas (como GIMP ou Photoshop).
- **Nem retrô antiquado**: Evita a armadilha de parecer um Paint antigo de 16 cores (Windows 95/98), no qual a maioria dos clones cai.
- **Modern Fluent UI**: Traz a estética moderna e fluída do **Windows 11 Paint**, com suporte a **Modo Escuro / Claro** integrado para se harmonizar perfeitamente com o ecossistema do **Zorin OS / Linux**.

---

## ✨ Funcionalidades

### 🖌️ Ferramentas & Pincéis
- **Lápis de Desenho**: Traço com espessura dinâmica de 1px a 50px.
- **Pincéis Texturizados**: 9 pincéis completos (Padrão Redondo, Caligrafia 1 & 2, Aerógrafo/Spray, Tinta a Óleo, Crayon, Marcador, Lápis Natural e Aquarela).
- **Balde de Tinta (Preenchimento)**: Algoritmo BFS ultrarrápido com tolerância de cor.
- **Borracha**: Apagamento inteligente com preview de cursor.
- **Conta-gotas (Eyedropper)**: Captura de cores da tela para Cor 1 (clique esquerdo) ou Cor 2 (clique direito).
- **Lupa / Zoom**: Zoom fluído de 10% a 800% com ajuste à tela.
- **Edição de Texto**: Caixa de texto *in-place* com escolha de fonte, tamanho, Negrito, Itálico, Sublinhado, Tachado e fundo opaco/transparente.

### 📐 Formas Geométricas & Curvas
- Reta, Curva Bezier, Retângulo, Retângulo Arredondado, Elipse/Círculo, Polígonos, Triângulos, Losango, Pentágono, Estrela, Setas, Balão de Fala, Coração e Raio.
- Opções de contornos e preenchimentos (Sólido, Giz, Óleo, Aquarela, etc.).

### ✂️ Seleção & Área de Transferência
- Seleção Retangular e Livre com borda *marching ants*.
- **Modo Seleção Transparente** (ignora a Cor 2 como fundo).
- Recortar (`Ctrl+X`), Copiar (`Ctrl+C`), Colar (`Ctrl+V`) e Cortar para Seleção.
- **Auto-Ajuste do Canvas**: Expande a tela automaticamente ao colar imagens maiores.

### 🖼️ Manipulação de Tela
- Alças inteligentes nos cantos (`scale(1 / zoom)`) que mantêm tamanho constante em qualquer zoom.
- Rotação (90° Direita/Esquerda, 180°) e Espelhamento (Horizontal/Vertical).
- Redimensionar por pixels ou porcentagem com trava de proporção.

---

## ⌨️ Atalhos de Teclado

| Ação | Atalho |
| :--- | :--- |
| **Novo Arquivo** | `Alt + N` / `Ctrl + Shift + N` |
| **Abrir Imagem** | `Ctrl + O` |
| **Salvar Imagem** | `Ctrl + S` |
| **Desfazer / Refazer** | `Ctrl + Z` / `Ctrl + Y` |
| **Recortar / Copiar / Colar** | `Ctrl + X` / `Ctrl + C` / `Ctrl + V` |
| **Selecionar Tudo** | `Ctrl + A` |
| **Aumentar Espessura** | `Ctrl + +` / `]` / `Alt + Roda do Mouse` |
| **Diminuir Espessura** | `Ctrl + -` / `[` / `Alt + Roda do Mouse` |
| **Zoom In / Out** | `Ctrl + Roda do Mouse` |
| **Lápis / Borracha / Balde** | `P` / `E` / `B` |
| **Conta-gotas / Texto / Zoom** | `I` / `T` / `Z` |
| **Trocar Cor 1 e Cor 2** | `X` |

---

## 🚀 Como Executar Localmente no Linux / Zorin OS

1. Clone o repositório:
```bash
git clone https://github.com/Kcaiooooo/caios-paint.git
cd caios-paint
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Acesse `http://localhost:5173` no seu navegador (Chrome / Brave / Firefox).

### 💡 Dica: Transformar em WebApp no Zorin OS
No Chrome ou Brave, acesse `http://localhost:5173`, clique no menu `⋮` ➔ **Mais Ferramentas** ➔ **Criar Atalho...** e marque a opção **"Abrir como janela"**. Um ícone do **Caio's Paint** será adicionado ao menu de aplicativos do Zorin OS!

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 & Canvas API** (Renderização 2D de alta performance)
- **CSS3 Vanilla** (Sistema de Design Fluent UI com temas dinâmicos)
- **JavaScript ES6+** (Arquitetura modular de ferramentas)
- **Vite** (Bundler e servidor de desenvolvimento ultra-rápido)
- **Lucide Icons** (Ícones modernos estilo Windows 11)

---

Desenvolvido com ❤️ para o ecossistema Linux.
