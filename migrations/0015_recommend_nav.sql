UPDATE settings SET value=json_set(value,'$.navInterests','推荐') WHERE key='home-copy';
