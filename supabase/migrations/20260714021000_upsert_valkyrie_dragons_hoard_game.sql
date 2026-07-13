do $$
declare
  target_game_id uuid;
begin
  update public.games
  set
    name = 'Valkyrie: Dragon''s Hoard',
    type = 'slot',
    supports_live = false,
    published = true,
    launch_url = 'https://valkyrie-dragons-hoard.pages.dev/',
    thumbnail = '/games/valkyrie-dragons-hoard/cover.webp',
    sort_order = 0
  where slug = 'valkyrie-dragons-hoard'
  returning id into target_game_id;

  if target_game_id is null then
    insert into public.games (
      name,
      slug,
      type,
      supports_live,
      published,
      launch_url,
      thumbnail,
      sort_order
    )
    values (
      'Valkyrie: Dragon''s Hoard',
      'valkyrie-dragons-hoard',
      'slot',
      false,
      true,
      'https://valkyrie-dragons-hoard.pages.dev/',
      '/games/valkyrie-dragons-hoard/cover.webp',
      0
    );
  end if;
end $$;
