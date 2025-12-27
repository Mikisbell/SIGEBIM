-- Create storage bucket for files
insert into storage.buckets (id, name, public) 
values ('files_bucket', 'files_bucket', true) 
on conflict (id) do nothing;

-- Policy to allow authenticated users to upload
create policy "Authenticated users can upload files"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'files_bucket' );

-- Policy to allow public access to read files (or restricted to auth users if needed)
create policy "Authenticated users can read files"
on storage.objects for select
to authenticated
using ( bucket_id = 'files_bucket' );
