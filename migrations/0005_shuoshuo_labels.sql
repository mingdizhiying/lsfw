UPDATE settings SET value=json_set(replace(replace(value,'短笔记','说说'),'笔记','说说'),'$.navNotes','说说') WHERE key='home-copy';
