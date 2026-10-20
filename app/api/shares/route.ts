import {sessionClient} from '../../../lib/supabase';
import {json,sameOrigin,rpcFailure} from '../../../lib/http';
export const dynamic='force-dynamic';
async function ownerClient(){const client=await sessionClient();const {data:{user}}=await client.auth.getUser();return user?client:null}
export async function GET(){try{const client=await ownerClient();if(!client)return json({error:'无权访问'},403);const {data,error}=await client.rpc('axue_wb_share_list');return error?rpcFailure(error):json({shares:data})}catch{return json({error:'无法读取分享记录'},503)}}
export async function POST(request:Request){if(!sameOrigin(request))return json({error:'请求来源无效'},403);try{const client=await ownerClient();if(!client)return json({error:'无权访问'},403);const {data,error}=await client.rpc('axue_wb_share_create');return error?rpcFailure(error):json(data)}catch{return json({error:'无法创建分享链接'},503)}}
export async function DELETE(request:Request){if(!sameOrigin(request))return json({error:'请求来源无效'},403);try{const client=await ownerClient();if(!client)return json({error:'无权访问'},403);let id;try{({id}=await request.json());if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw Error()}catch{return json({error:'分享编号无效'},400)}const {data,error}=await client.rpc('axue_wb_share_revoke',{p_id:id});return error?rpcFailure(error):json(data)}catch{return json({error:'无法撤销分享链接'},503)}}
