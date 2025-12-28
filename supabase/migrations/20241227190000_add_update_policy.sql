-- Add UPDATE policy for files table
-- This allows users to update file status after upload

create policy "Users can update files in their orgs"
    on files for update
    using ( project_id in (select id from projects where organization_id in (select get_my_org_ids())) );
