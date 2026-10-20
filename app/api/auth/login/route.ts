import {sessionClient} from '../../../../lib/supabase';
import {json,sameOrigin} from '../../../../lib/http';
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'请求来源无效'},403);
 try{const text=await request.text();if(text.length>20000)return json({error:'输入过长'},400);let email,password;try{({email,password}=JSON.parse(text));if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>4096||!email.trim()||!password)throw Error()}catch{return json({error:'请填写登录邮箱和密码'},400)}
 const client=await sessionClient();const {error}=await client.auth.signInWithPassword({email:email.trim(),password});if(error)return json({error:'登录失败，请检查邮箱和密码；首次使用请先完成账号设置'},401);
 const {error:permissionError}=await client.rpc('axue_wb_read',{p_token:null});if(permissionError){await client.auth.signOut({scope:'local'});return json({error:'该账号尚未设为工作台管理员，请先完成管理员设置'},403)}
 return json({ok:true});
 }catch{return json({error:'请完成 Supabase 环境变量和数据库设置后重试'},503)}
}
