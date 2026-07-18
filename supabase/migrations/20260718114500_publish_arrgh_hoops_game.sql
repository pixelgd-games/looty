update public.games
set
  published = true,
  name = 'Arrgh! Hoops',
  type = 'arcade',
  supports_live = false,
  launch_url = 'https://arrgh-hoops.pages.dev/',
  thumbnail = '/games/arrgh-hoops/cover.webp',
  sort_order = 0
where slug = 'arrgh-hoops';
