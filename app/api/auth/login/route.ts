import {sessionClient} from '../../../../lib/supabase';
import {json,sameOrigin} from '../../../../lib/http';
export async function POST(request:Request){
 if(!sameOrigin(request))return json({error:'请求来源无效'},403);
 try{const text=await request.text();if(text.length>20000)return json({error:'输入过长'},400);let account,password;try{const body=JSON.parse(text);account=body.account??body.email;password=body.password;if(typeof account!=='string'||typeof password!=='string'||account.length>254||password.length>4096||!account.trim()||!password)throw Error()}catch{return json({error:'请填写用户名或邮箱，以及密码'},400)}
 let email=account.trim();
 if(email.toLowerCase()==='lix'){
   const configured=process.env.WORKBENCH_LOGIN_EMAIL?.trim();
   if(!configured||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured))return json({error:'用户名尚未配置，请暂时使用原邮箱登录'},503);
   email=configured;
 }else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){return json({error:'用户名或密码不正确'},401)}
 const client=await sessionClient();const {error}=await client.auth.signInWithPassword({email,password});if(error)return json({error:'登录失败，请检查用户名或邮箱和密码；首次使用请先完成账号设置'},401);
 const {error:permissionError}=await client.rpc('axue_wb_read',{p_token:null});if(permissionError){await client.auth.signOut({scope:'local'});return json({error:'该账号尚未设为工作台管理员，请先完成管理员设置'},403)}
 return json({ok:true});
 }catch{return json({error:'请完成 Supabase 环境变量和数据库设置后重试'},503)}
}
