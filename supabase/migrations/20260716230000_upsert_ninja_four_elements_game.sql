do $$
declare
  target_game_id uuid;
begin
  update public.games
  set
    name = 'Ninja: Four Elements',
    type = 'slot',
    supports_live = false,
    published = true,
    launch_url = 'https://ninja-four-elements.pages.dev/',
    thumbnail = '/games/ninja-four-elements/cover.webp',
    sort_order = 0
  where slug = 'ninja-four-elements'
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
      'Ninja: Four Elements',
      'ninja-four-elements',
      'slot',
      false,
      true,
      'https://ninja-four-elements.pages.dev/',
      '/games/ninja-four-elements/cover.webp',
      0
    );
  end if;
end $$;
