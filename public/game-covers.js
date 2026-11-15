// Verified Steam store matches for the existing Bangumi recommendations.
const steamMatches={172531:264710,249380:883710,264147:653530,95353:557600,283730:753640,431295:1931770,327616:1195290};
export function gameSteamId(game){const id=Number(game.steam_appid)||steamMatches[game.bgm_id];return Number.isSafeInteger(id)&&id>0?id:null;}
export function gameCover(game){
 const id=gameSteamId(game);
 if(id===4618570)return 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4618570/1cda04b4e860b7ea78443c19aba464826e7df820/library_capsule_schinese.jpg';
 if(/\/library_capsule[^/]*\.(jpg|png|webp)(\?|$)/.test(game.cover||''))return game.cover;
 return Number.isSafeInteger(id)&&id>0?`https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900.jpg`:game.cover;
}
