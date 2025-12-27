-- Secure Function to Create Organization and Owner Member atomically
-- Bypass RLS using SECURITY DEFINER

create or replace function create_organization_with_owner(org_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_org_id uuid;
begin
  -- 1. Create Organization
  insert into organizations (name)
  values (org_name)
  returning id into new_org_id;

  -- 2. Add Current User as Owner
  insert into organization_members (organization_id, user_id, role)
  values (new_org_id, auth.uid(), 'owner');

  return new_org_id;
end;
$$;
