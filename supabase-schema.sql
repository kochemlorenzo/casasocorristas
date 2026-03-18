-- =============================================
-- CASA SOCORRISTA — Supabase Schema
-- Execute no SQL Editor do Supabase
-- =============================================

-- EXTENSÕES
create extension if not exists "uuid-ossp";

-- =============================================
-- TABELAS
-- =============================================

-- Categorias de produtos
create table if not exists categorias (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  ativo boolean default true,
  criado_em timestamptz default now()
);

-- Produtos
create table if not exists produtos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  slug text not null unique,
  descricao text,
  descricao_curta text,
  preco decimal(10,2) not null,
  preco_promocional decimal(10,2),
  estoque integer not null default 0,
  estoque_minimo integer default 5,
  categoria_id uuid references categorias(id) on delete set null,
  imagens text[] default '{}',
  imagem_principal text,
  ativo boolean default true,
  destaque boolean default false,
  sku text unique,
  peso decimal(8,3),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Clientes
create table if not exists clientes (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  email text unique,
  telefone text,
  cpf text,
  endereco_rua text,
  endereco_numero text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  criado_em timestamptz default now()
);

-- Pedidos
create table if not exists pedidos (
  id uuid default uuid_generate_v4() primary key,
  numero text not null unique,
  cliente_id uuid references clientes(id) on delete set null,
  cliente_nome text not null,
  cliente_telefone text,
  status text not null default 'pendente'
    check (status in ('pendente','confirmado','preparando','pronto','entregue','cancelado')),
  tipo_entrega text default 'retirada'
    check (tipo_entrega in ('retirada','delivery')),
  endereco_entrega text,
  total decimal(10,2) not null,
  observacoes text,
  unidade text,
  pago boolean default false,
  forma_pagamento text,
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Itens dos pedidos
create table if not exists pedido_itens (
  id uuid default uuid_generate_v4() primary key,
  pedido_id uuid references pedidos(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  produto_nome text not null,
  produto_preco decimal(10,2) not null,
  quantidade integer not null,
  subtotal decimal(10,2) not null
);

-- Movimentações de estoque
create table if not exists estoque_movimentacoes (
  id uuid default uuid_generate_v4() primary key,
  produto_id uuid references produtos(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida','ajuste')),
  quantidade integer not null,
  motivo text,
  pedido_id uuid references pedidos(id) on delete set null,
  criado_em timestamptz default now()
);

-- Admin users (além do auth do Supabase)
create table if not exists admin_perfis (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text,
  email text,
  role text default 'admin',
  criado_em timestamptz default now()
);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Auto-update atualizado_em
create or replace function update_atualizado_em()
returns trigger as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$ language plpgsql;

create trigger produtos_atualizado_em
  before update on produtos
  for each row execute function update_atualizado_em();

create trigger pedidos_atualizado_em
  before update on pedidos
  for each row execute function update_atualizado_em();

-- Gerar número do pedido automaticamente
create or replace function gerar_numero_pedido()
returns trigger as $$
begin
  new.numero = 'PED-' || lpad(nextval('pedido_seq')::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create sequence if not exists pedido_seq start 1;

create trigger pedidos_numero
  before insert on pedidos
  for each row execute function gerar_numero_pedido();

-- Baixar estoque ao confirmar pedido
create or replace function baixar_estoque_pedido()
returns trigger as $$
begin
  if new.status = 'confirmado' and old.status = 'pendente' then
    update produtos p
    set estoque = p.estoque - pi.quantidade
    from pedido_itens pi
    where pi.pedido_id = new.id
    and pi.produto_id = p.id;

    insert into estoque_movimentacoes (produto_id, tipo, quantidade, motivo, pedido_id)
    select pi.produto_id, 'saida', pi.quantidade, 'Pedido confirmado', new.id
    from pedido_itens pi
    where pi.pedido_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger pedido_confirmado_estoque
  after update on pedidos
  for each row execute function baixar_estoque_pedido();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

alter table produtos enable row level security;
alter table categorias enable row level security;
alter table pedidos enable row level security;
alter table pedido_itens enable row level security;
alter table clientes enable row level security;
alter table estoque_movimentacoes enable row level security;
alter table admin_perfis enable row level security;

-- Produtos: leitura pública, escrita só admin
create policy "produtos_public_read" on produtos for select using (ativo = true);
create policy "produtos_admin_all" on produtos for all using (auth.role() = 'authenticated');

-- Categorias: leitura pública
create policy "categorias_public_read" on categorias for select using (ativo = true);
create policy "categorias_admin_all" on categorias for all using (auth.role() = 'authenticated');

-- Pedidos: usuário vê os próprios, admin vê todos
create policy "pedidos_admin_all" on pedidos for all using (auth.role() = 'authenticated');
create policy "pedidos_insert_public" on pedidos for insert with check (true);

-- Pedido itens
create policy "pedido_itens_admin_all" on pedido_itens for all using (auth.role() = 'authenticated');
create policy "pedido_itens_insert_public" on pedido_itens for insert with check (true);

-- Clientes
create policy "clientes_admin_all" on clientes for all using (auth.role() = 'authenticated');
create policy "clientes_insert_public" on clientes for insert with check (true);

-- Estoque
create policy "estoque_admin_all" on estoque_movimentacoes for all using (auth.role() = 'authenticated');

-- =============================================
-- STORAGE (para imagens de produtos)
-- =============================================

insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict do nothing;

create policy "produtos_images_public_read" on storage.objects
  for select using (bucket_id = 'produtos');

create policy "produtos_images_admin_upload" on storage.objects
  for insert with check (bucket_id = 'produtos' and auth.role() = 'authenticated');

create policy "produtos_images_admin_delete" on storage.objects
  for delete using (bucket_id = 'produtos' and auth.role() = 'authenticated');

-- =============================================
-- DADOS INICIAIS
-- =============================================

insert into categorias (nome, slug, descricao) values
  ('Medicamentos', 'medicamentos', 'Remédios e produtos farmacêuticos'),
  ('Suplementos', 'suplementos', 'Vitaminas e suplementos alimentares'),
  ('Higiene Pessoal', 'higiene-pessoal', 'Produtos de higiene e cuidado pessoal'),
  ('Primeiros Socorros', 'primeiros-socorros', 'Curativos, ataduras e material médico'),
  ('Beleza', 'beleza', 'Cosméticos e produtos de beleza')
on conflict do nothing;
