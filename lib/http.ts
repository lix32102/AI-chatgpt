export const responseHeaders={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export function json(data:unknown,status=200){return Response.json(data,{status,headers:responseHeaders})}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('content-type')?.startsWith('application/json')}
export function rpcFailure(error:{code?:string}|null,read=false){
 if(error?.code==='40001')return json({error:'其他页面已更新，请先导出本页备份，再重新加载最新版本'},409);
 if(error?.code==='42501'||error?.code==='PGRST301'||error?.code==='PGRST303')return json({error:'请登录管理账号，或使用有效的只读分享链接'},read?401:403);
 return json({error:'云端尚未配置完成或暂时无法连接，请稍后重试'},503);
}
