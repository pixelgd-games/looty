do $$
declare
  updated_count integer;
begin
  if exists (
    select 1
    from public.games
    where slug = 'monster-lab'
      and id <> '176b81a4-a304-4f41-8c5e-37bebe371305'::uuid
  ) then
    raise exception 'monster-lab slug is already used' using errcode = '23505';
  end if;

  update public.games
  set
    name = 'Monster Lab',
    slug = 'monster-lab',
    launch_url = 'https://monster-lab-7aj.pages.dev/?resultSource=server&apiBase=https%3A%2F%2Fmonster-lab-api.pixelgd-games.workers.dev'
  where id = '176b81a4-a304-4f41-8c5e-37bebe371305'::uuid;

  get diagnostics updated_count = row_count;

  if updated_count <> 1 then
    raise exception 'Monster Lab game was not found' using errcode = 'P0002';
  end if;
end $$;
