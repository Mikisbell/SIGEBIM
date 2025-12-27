-- Ensure authenticated users can create organizations
drop policy if exists "Users can create organizations" on organizations;
create policy "Users can create organizations"
    on organizations for insert
    to authenticated
    with check ( true );

-- Ensure authenticated users can add themselves as members (necessary for joining the org they just created)
drop policy if exists "Users can join organizations" on organization_members;
create policy "Users can join organizations"
    on organization_members for insert
    to authenticated
    with check ( auth.uid() = user_id );
