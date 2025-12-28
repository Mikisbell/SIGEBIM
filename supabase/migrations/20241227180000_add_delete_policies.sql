-- Add DELETE policies for files and audit_results

-- Files: Users can delete files in their orgs (via projects)
create policy "Users can delete files in their orgs"
    on files for delete
    using ( project_id in (select id from projects where organization_id in (select get_my_org_ids())) );

-- Audit Results: Users can delete audit results for their files
create policy "Users can delete audit results for their files"
    on audit_results for delete
    using ( file_id in (select id from files where project_id in (select id from projects where organization_id in (select get_my_org_ids()))) );
