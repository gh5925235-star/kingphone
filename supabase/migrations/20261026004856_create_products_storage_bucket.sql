-- Create the "products" storage bucket for product/variant images.
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Allow authenticated admins to upload/update/delete product images.
create policy "products_upload_auth"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products');

create policy "products_update_auth"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products')
  with check (bucket_id = 'products');

create policy "products_delete_auth"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products');

-- Public read access for product images.
create policy "products_read_public"
  on storage.objects for select
  to public
  using (bucket_id = 'products');
