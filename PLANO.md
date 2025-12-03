# Plano de Desenvolvimento - OrganizaMe SaaS

## Arquitetura Geral

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│   React     │────▶│  Django Ninja   │────▶│  Supabase   │
│  (futuro)   │◀────│      API        │◀────│  PostgreSQL │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       └───────────── Supabase Auth ───────────────┘
```

**Tech Stack Backend:**

- Django 5.x
- Django Ninja (API REST com tipagem)
- Pydantic (validação de schemas)
- Supabase PostgreSQL

---

## Fase 1: Setup do Ambiente

1. Criar ambiente virtual Python
2. Instalar Django + Django Ninja
3. Configurar conexão com Supabase PostgreSQL
4. Estruturar o projeto com apps modulares

**Estrutura de pastas:**

```
organiza_me/
├── config/
│   ├── settings/
│   │   ├── base.py
│   │   ├── local.py
│   │   └── production.py
│   ├── urls.py
│   └── api.py           # Configuração do Django Ninja
├── apps/
│   ├── users/
│   ├── workspaces/
│   ├── boards/
│   └── tasks/
├── requirements/
│   ├── base.txt
│   ├── local.txt
│   └── production.txt
└── manage.py
```

---

## Fase 2: Modelagem do Banco de Dados

**Diagrama de Entidades (cardinalidade):**

```
User (Supabase Auth)
  │
  │  1:N (um usuário → VÁRIAS áreas de trabalho)
  │
  └──▶ Workspace ──── ex: "Trabalho", "Pessoal", "Estudos"
         │
         │  1:N (uma área → VÁRIOS painéis kanban)
         │
         └──▶ Board ──── ex: "Projeto Alpha", "Finanças"
                │
                │  1:N (um painel → VÁRIOS estágios)
                │
                ├──▶ Stage ──── padrão: "A Fazer" → "Fazendo" → "Concluído"
                │       │
                │       │  1:N (um estágio → VÁRIAS tarefas)
                │       │
                │       └──▶ Task (card)
                │              ├──▶ Tag (N:N)
                │              ├──▶ Subtask (1:N)
                │              └──▶ Attachment (1:N)
                │
                └──▶ Tags pertencem ao Workspace (compartilhadas entre Boards)
```

**Campos por modelo:**

| Modelo | Campos |
|--------|--------|
| Workspace | name, description, owner_uid, created_at |
| Board | name, workspace (FK), position, created_at |
| Stage | name, board (FK), position, color |
| Task | title, description, stage (FK), position, start_date, due_date |
| Tag | name, color, workspace (FK) |
| Subtask | title, task (FK), is_completed, position |
| Attachment | file_url, file_name, task (FK), uploaded_at |

---

## Fase 3: Autenticação (Supabase Auth)

1. Middleware para validar JWT do Supabase
2. Modelo `UserProfile` com `supabase_uid`
3. Decorators de autenticação nos endpoints

---

## Fase 4: Endpoints da API (Django Ninja)

**Workspaces:**

- `GET /api/workspaces/` - listar
- `POST /api/workspaces/` - criar
- `GET /api/workspaces/{id}/` - detalhe
- `PUT /api/workspaces/{id}/` - atualizar
- `DELETE /api/workspaces/{id}/` - remover

**Boards, Stages, Tasks:** - mesma estrutura CRUD

- `POST /api/tasks/{id}/move/` - mover entre stages
- `POST /api/stages/reorder/` - reordenar estágios

---

## Fase 5: Regras de Negócio

1. **Stages padrão**: Criar 3 stages ao criar Board
2. **Posicionamento**: Campo `position` para drag-and-drop
3. **Permissões**: Apenas owner pode editar Workspace
4. **Tags compartilhadas**: Criadas no Workspace, usadas em qualquer Task

---

## Estratégia de Testes

- **Swagger UI** automático do Django Ninja: `http://localhost:8000/api/docs`
- Testar todos os endpoints direto no navegador
- Sem necessidade de criar páginas HTML

---

## Ordem de Desenvolvimento

1. Setup ambiente + Django Ninja + Supabase
2. Model Workspace + endpoints CRUD
3. Model Board + endpoints
4. Model Stage + criação automática
5. Model Task + movimentação
6. Tag, Subtask, Attachment
7. Autenticação Supabase JWT
8. Documentação final

**Frontend React:** será desenvolvido posteriormente por IA, consumindo esta API.

