-- Fix stuck files: Update all files with 'uploading' status to 'uploaded'
-- This fixes files that were uploaded to R2 but status wasn't updated due to missing RLS policy

UPDATE files SET upload_status = 'uploaded' WHERE upload_status = 'uploading';
