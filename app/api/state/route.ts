import {requestClient,sessionClient} from '../../../lib/supabase';
import {json,sameOrigin,rpcFailure} from '../../../lib/http';
import {validateState} from '../../../lib/validate';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{
 const token=request.headers.get('X-Workbench-Share');if(token&&!/^[a-f0-9]{64}$/.test(token))return json({error:'分享链接无效'},401);
 const client=await requestClient(request);const {data,error}=await client.rpc('axue_wb_read',{p_token:token||null});
 return error?rpcFailure(error,true):json(data);
}catch{return json({error:'请完成云端配置后重试'},503)}}
export async function PUT(request:Request){
 if(!sameOrigin(request))return json({error:'请求来源无效'},403);
 try{
 const client=await sessionClient();const {data:{user}}=await client.auth.getUser();if(!user)return json({error:'请先登录管理账号'},403);
 const text=await request.text();if(new TextEncoder().encode(text).length>4000000)return json({error:'数据超过4MB，请减少备注或拆分任务'},413);
 let body,state;try{body=JSON.parse(text);state=validateState(body.state);if(!Number.isSafeInteger(body.revision)||body.revision<0)throw Error()}catch{return json({error:'任务数据或版本格式不正确'},400)}
 const {data,error}=await client.rpc('axue_wb_write',{p_state:state,p_revision:body.revision});return error?rpcFailure(error):json(data);
 }catch{return json({error:'云端暂时无法保存，请导出备份后重试'},503)}
}
