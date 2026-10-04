UPDATE settings SET value=json_set(value,'$.navGames','游戏') WHERE key='home-copy';
