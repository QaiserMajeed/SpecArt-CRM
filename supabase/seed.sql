-- SpecArt CRM - Seed Data
-- Run this AFTER running schema.sql and creating the admin user in Supabase Auth dashboard
--
-- STEP 1: Go to Supabase Dashboard > Authentication > Users > Add User
--         Email: admin@specart.com, Password: admin123 (or your preferred password)
--         Make sure "Auto Confirm User" is checked
--
-- STEP 2: Run this seed script in SQL Editor

-- Update the auto-created profile to admin role
update public.profiles
set role = 'admin', name = 'Admin User', phone = '+1 555-0100'
where email = 'admin@specart.com';

-- Seed workspaces and related data
do $$
declare
  admin_id uuid;
  ws_bd_id uuid;
  ws_sales_id uuid;
begin
  select id into admin_id from public.profiles where email = 'admin@specart.com';

  if admin_id is null then
    raise exception 'Admin user not found. Create the admin user in Auth dashboard first.';
  end if;

  -- Create workspaces
  insert into public.workspaces (name, description, icon, color, created_by, is_active)
  values (
    'BD Lead Management',
    'Business Development leads for editors, motion graphic artists, and animators',
    'Target', 'from-[#7567F8] to-[#9B9BFF]', admin_id, true
  ) returning id into ws_bd_id;

  insert into public.workspaces (name, description, icon, color, created_by, is_active)
  values (
    'Sales Leads Management',
    'Sales leads from cold calling and prospecting',
    'Phone', 'from-[#10B981] to-[#34D399]', admin_id, true
  ) returning id into ws_sales_id;

  -- Assign admin to both workspaces
  insert into public.user_workspaces (user_id, workspace_id) values
    (admin_id, ws_bd_id),
    (admin_id, ws_sales_id);

  -- Tags
  insert into public.tags (name, color, workspace_id) values
    ('video-editing', '#7567F8', ws_bd_id),
    ('motion-graphics', '#10B981', ws_bd_id),
    ('animation', '#F59E0B', ws_bd_id),
    ('high-budget', '#EF4444', ws_bd_id),
    ('recurring', '#8B5CF6', ws_bd_id),
    ('cold-call', '#6B7280', ws_sales_id),
    ('follow-up-needed', '#EC4899', ws_sales_id);

  -- Custom fields
  insert into public.custom_fields (name, type, workspace_id, is_required, "order") values
    ('LinkedIn URL', 'text', ws_bd_id, false, 1),
    ('Project Budget', 'number', ws_bd_id, false, 2);

  insert into public.custom_fields (name, type, options, workspace_id, is_required, "order") values
    ('Source', 'select', ARRAY['Referral', 'Website', 'Social Media', 'Cold Call', 'Other'], ws_sales_id, false, 1);

  -- Lead sources
  insert into public.lead_sources (name, workspace_id) values
    ('Referral', ws_bd_id),
    ('Website', ws_bd_id),
    ('Social Media', ws_bd_id),
    ('Cold Call', ws_sales_id),
    ('Email Campaign', ws_sales_id);

  -- Sample leads/clients
  insert into public.lead_clients (name, phone_number, email, company_name, notes,
    last_follow_up_date, next_follow_up_date, follow_up_category, category, sub_category,
    assigned_to, workspace_id, tags, custom_fields, source, created_by) values
    ('John Smith', '+1 555-0101', 'john.smith@techcorp.com', 'TechCorp Inc.',
     'Looking for video editing services. Budget $5k.',
     '2024-02-10'::timestamptz, '2024-02-15'::timestamptz, 'call', 'lead', 'hot',
     'Admin User', ws_bd_id, ARRAY['video-editing', 'high-budget'], '{}', 'Referral', admin_id),
    ('Sarah Johnson', '+1 555-0102', 'sarah.j@mediastudio.com', 'Media Studio Pro',
     'Needs motion graphics for new campaign.',
     '2024-02-08'::timestamptz, '2024-02-14'::timestamptz, 'email', 'lead', 'warm',
     'Admin User', ws_bd_id, ARRAY['motion-graphics'], '{}', 'Website', admin_id),
    ('Mike Chen', '+1 555-0103', 'mike.chen@animationhub.com', 'Animation Hub',
     'Ongoing animation project. Very satisfied.',
     '2024-02-12'::timestamptz, '2024-02-20'::timestamptz, 'meeting', 'client', 'active',
     'Admin User', ws_bd_id, ARRAY['animation', 'recurring'], '{}', 'Referral', admin_id),
    ('Emily Davis', '+1 555-0104', 'emily.d@coldprospect.com', 'Cold Prospect LLC',
     'Cold called on Feb 1st. Interested but needs time.',
     '2024-02-01'::timestamptz, '2024-02-18'::timestamptz, 'follow_up', 'lead', 'cold',
     'Admin User', ws_sales_id, ARRAY['cold-call'], '{}', 'Cold Call', admin_id);

  -- Sample follow-ups
  insert into public.follow_ups (lead_client_id, date, category, notes, completed, created_by)
  select lc.id, '2024-02-15'::timestamptz, 'call',
         'Discuss project requirements and timeline', false, admin_id
  from public.lead_clients lc where lc.name = 'John Smith';

  insert into public.follow_ups (lead_client_id, date, category, notes, completed, created_by)
  select lc.id, '2024-02-20'::timestamptz, 'meeting',
         'Monthly review meeting', false, admin_id
  from public.lead_clients lc where lc.name = 'Mike Chen';

end $$;
