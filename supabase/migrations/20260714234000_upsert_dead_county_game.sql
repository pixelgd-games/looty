do $$
declare
  target_game_id uuid;
begin
  update public.games
  set
    name = 'Dead County',
    type = 'fish',
    supports_live = false,
    published = true,
    launch_url = 'https://dead-county.pages.dev/',
    thumbnail = '/games/dead-county/cover.webp',
    sort_order = 0
  where slug = 'dead-county'
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
      'Dead County',
      'dead-county',
      'fish',
      false,
      true,
      'https://dead-county.pages.dev/',
      '/games/dead-county/cover.webp',
      0
    );
  end if;
end $$;
