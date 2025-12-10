# ORGANIZA.ME - Design System Prompt

## Para IAs: Copie este prompt ao trabalhar no frontend

---

## 🎯 Filosofia do Design

**Estilo: "Digital Paper" (Notion-like)**

Sistema de gerenciamento de tarefas com visual minimalista inspirado no Notion. Design "menos é mais" - editorial, limpo, foco no conteúdo.

### Princípios:
1. **Fundo branco/off-white** - Como uma folha de papel
2. **Tipografia clara** - Sans-serif, hierarquia definida
3. **Cores suaves** - Tons pastéis, nada saturado
4. **Espaçamento generoso** - Respiro visual
5. **Bordas sutis** - Linhas finas, cores neutras
6. **Sombras mínimas** - Elevação sutil
7. **Interações suaves** - Transições 150-200ms

---

## 🎨 Paleta de Cores

```css
:root {
  /* BACKGROUNDS */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F7F7F5;
  --bg-tertiary: #FBFBFA;
  --bg-hover: #EFEFEF;
  --bg-active: #E8E8E8;
  
  /* TEXTO */
  --text-primary: #37352F;
  --text-secondary: #6B6B6B;
  --text-tertiary: #9B9B9B;
  --text-placeholder: #C4C4C4;
  
  /* BORDAS */
  --border-light: #E8E8E8;
  --border-default: #DFDFDE;
  --border-strong: #C4C4C4;
  
  /* CORES DE DESTAQUE */
  --blue: #2383E2;
  --blue-light: #E8F4FD;
  --green: #0F7B6C;
  --red: #EB5757;
  --orange: #D9730D;
  --yellow: #CB912F;
  --purple: #9065B0;
  --pink: #C14C8A;
  
  /* TAGS */
  --tag-gray: #E3E2E0;
  --tag-brown: #EEE0DA;
  --tag-orange: #FAEBDD;
  --tag-yellow: #FBF3DB;
  --tag-green: #DDEDEA;
  --tag-blue: #DDEBF1;
  --tag-purple: #E8DEEE;
  --tag-pink: #F4DFEB;
  --tag-red: #FFE2DD;
}
```

---

## 📝 Tipografia

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Hierarquia */
.page-title { font-size: 28px; font-weight: 700; color: #37352F; }
.section-title { font-size: 18px; font-weight: 600; }
.body-text { font-size: 14px; line-height: 1.6; }
.caption { font-size: 12px; color: #6B6B6B; }
.label { font-size: 11px; font-weight: 500; text-transform: uppercase; }
```

---

## 🧩 Componentes

### Botões
```css
.btn-primary {
  background: #2383E2;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
}
.btn-primary:hover { background: #1a6fc9; }

.btn-secondary {
  background: #F7F7F5;
  color: #37352F;
  border: 1px solid #DFDFDE;
  padding: 8px 14px;
  border-radius: 6px;
}

.btn-ghost {
  background: transparent;
  color: #6B6B6B;
  padding: 6px 10px;
  border-radius: 4px;
}
.btn-ghost:hover { background: #EFEFEF; }
```

### Inputs
```css
.input {
  padding: 10px 12px;
  border: 1px solid #DFDFDE;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}
.input:focus {
  border-color: #2383E2;
  box-shadow: 0 0 0 3px #E8F4FD;
}
```

### Cards
```css
.card {
  background: white;
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  padding: 16px;
}
.card:hover {
  border-color: #DFDFDE;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.task-card {
  background: white;
  border: 1px solid #E8E8E8;
  border-radius: 6px;
  padding: 12px;
}
.task-card.dragging {
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transform: rotate(2deg);
}
```

### Tags
```css
.tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
/* Cor dinâmica: background: ${color}20, color: ${color} */
```

### Modal
```css
.modal-overlay {
  background: rgba(0,0,0,0.4);
  position: fixed;
  inset: 0;
}
.modal {
  background: white;
  border-radius: 12px;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
```

### Kanban
```css
.kanban { display: flex; gap: 16px; overflow-x: auto; }
.kanban-column {
  flex: 0 0 280px;
  background: #F7F7F5;
  border-radius: 8px;
  border: 1px solid #E8E8E8;
}
```

---

## 🚫 EVITAR

- Cores saturadas demais
- Sombras pesadas (max rgba(0,0,0,0.1))
- Bordas grossas (max 2px)
- Gradientes chamativos
- Fontes decorativas
- Animações longas (max 200ms)
- Dark mode - sistema é light-only

---

## ✅ Checklist Novos Componentes

- Fundo branco ou #F7F7F5
- Texto principal #37352F
- Bordas #E8E8E8 ou #DFDFDE
- Border-radius 4-8px
- Padding: 8px, 12px, 16px, 24px
- Hover: background #EFEFEF
- Transição: 150ms
- Focus: borda azul + sombra suave

---

## Referências: Notion, Linear, Craft, Things 3

**Mantenha: Limpo, Leve, Legível.**
