export function recoveryTokens(hash:string){
 const p=new URLSearchParams(hash.replace(/^#/,''));
 if(p.get('type')!=='recovery')return null;
 const access_token=p.get('access_token'),refresh_token=p.get('refresh_token');
 if(!access_token||!refresh_token||access_token.length>20000||refresh_token.length>4096)return null;
 return {access_token,refresh_token};
}
