-- SIGEBIM Database Initialization Script
-- Role: God Level Architecture
-- Rationale: Full multi-tenancy, strict types, RLS enabled by default.

-- 1. Extensions
create extension if not exists "uuid-ossp";

-- 2. Enums (Strict Typing)
create type subscription_plan as enum ('free', 'pro', 'enterprise');
create type project_status as enum ('active', 'archived', 'completed');
create type file_type as enum ('dxf', 'dwg', 'ifc');
create type upload_status as enum ('uploading', 'uploaded', 'processing', 'processed', 'error');
create type audit_status as enum ('pass', 'fail', 'warning', 'pending');

-- 3. Tables

-- Organizations (Tenant Root)
create table organizations (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    subscription_plan subscription_plan default 'free',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Organization Members (Link Users <-> Orgs)
create table organization_members (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    role text default 'member', -- 'owner', 'admin', 'member'
    created_at timestamp with time zone default now(),
    unique(organization_id, user_id)
);

-- Projects
create table projects (
    id uuid primary key default uuid_generate_v4(),
    organization_id uuid references organizations(id) on delete cascade not null,
    name text not null,
    code text,
    status project_status default 'active',
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Files
create table files (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid references projects(id) on delete cascade not null,
    uploader_id uuid references auth.users(id) on delete set null,
    filename text not null,
    storage_path text not null, -- Path inside the bucket
    file_type file_type not null,
    size_bytes bigint,
    version integer default 1,
    upload_status upload_status default 'uploading',
    created_at timestamp with time zone default now()
);

-- Audit Results
create table audit_results (
    id uuid primary key default uuid_generate_v4(),
    file_id uuid references files(id) on delete cascade not null,
    status audit_status not null,
    summary jsonb not null default '{}'::jsonb,
    details jsonb not null default '[]'::jsonb,
    processed_at timestamp with time zone default now()
);

-- 4. Row Level Security (RLS) - The Wall

alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table projects enable row level security;
alter table files enable row level security;
alter table audit_results enable row level security;

-- Helper function to get user's organizations
create or replace function get_my_org_ids()
returns setof uuid as $$
    select organization_id from organization_members
    where user_id = auth.uid()
$$ language sql security definer;

-- Policies

-- Organization Members: Users can see their own memberships
create policy "Users can view own memberships"
    on organization_members for select
    using ( auth.uid() = user_id );

-- Organizations: Users can view organizations they belong to
create policy "Users can view their organizations"
    on organizations for select
    using ( id in (select get_my_org_ids()) );

-- Projects: Users can view/edit projects in their orgs
create policy "Users can view projects in their orgs"
    on projects for select
    using ( organization_id in (select get_my_org_ids()) );

create policy "Users can insert projects in their orgs"
    on projects for insert
    with check ( organization_id in (select get_my_org_ids()) );

create policy "Users can update projects in their orgs"
    on projects for update
    using ( organization_id in (select get_my_org_ids()) );

-- Files: Users can view/edit files in their orgs (via projects)
create policy "Users can view files in their orgs"
    on files for select
    using ( project_id in (select id from projects where organization_id in (select get_my_org_ids())) );

create policy "Users can insert files in their orgs"
    on files for insert
    with check ( project_id in (select id from projects where organization_id in (select get_my_org_ids())) );

-- Audit Results: Inherit access from File
create policy "Users can view audit results for their files"
    on audit_results for select
    using ( file_id in (select id from files where project_id in (select id from projects where organization_id in (select get_my_org_ids()))) );

-- 5. Storage Policies (Conceptual - to be applied in Storage Settings)
-- Bucket: 'files_bucket'
-- Policy: GIVE select, insert TO authenticated USING ( bucket_id = 'files_bucket' );
-- (Fine-grained storage RLS usually requires db lookup, simplified here for script)

-- 6. Triggers (Auto-update timestamps)
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_organizations_modtime
    before update on organizations
    for each row execute procedure update_updated_at_column();

create trigger update_projects_modtime
    before update on projects
    for each row execute procedure update_updated_at_column();

-- End of Init Script
