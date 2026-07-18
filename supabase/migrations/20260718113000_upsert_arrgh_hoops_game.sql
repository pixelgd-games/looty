do $$
declare
  target_game_id uuid;
begin
  update public.games
  set
    name = 'Arrgh! Hoops',
    type = 'arcade',
    supports_live = false,
    published = false,
    launch_url = 'https://arrgh-hoops.pages.dev/',
    thumbnail = '/games/arrgh-hoops/cover.webp',
    sort_order = 0
  where slug = 'arrgh-hoops'
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
      'Arrgh! Hoops',
      'arrgh-hoops',
      'arcade',
      false,
      false,
      'https://arrgh-hoops.pages.dev/',
      '/games/arrgh-hoops/cover.webp',
      0
    );
  end if;
end $$;
