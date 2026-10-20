'use client';
import {useEffect,useRef,useState} from 'react';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import {recoveryTokens} from '../../lib/recovery';

export default function ResetPassword(){
 const client=useRef<SupabaseClient|null>(null),tokens=useRef<ReturnType<typeof recoveryTokens>>(null);
 const [phase,setPhase]=useState<'loading'|'request'|'password'|'complete'|'error'>('loading');
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 useEffect(()=>{let active=true;async function initialize(){try{
   const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)throw Error('工作台尚未配置完成，请稍后重试。');
   if(!client.current)client.current=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   if(!tokens.current)tokens.current=recoveryTokens(location.hash);
   if(location.hash)history.replaceState(null,'',location.pathname);
   if(!tokens.current){if(active)setPhase('request');return}
   const sdk=client.current;const {error}=await sdk.auth.setSession(tokens.current);
   if(error)throw Error('邮件链接已过期或无效，请重新发送密码重设邮件。');
   const {data:{user},error:userError}=await sdk.auth.getUser();
   if(userError||!user)throw Error('无法验证邮件链接，请重新发送密码重设邮件。');
   const {error:ownerError}=await sdk.rpc('axue_wb_read',{p_token:null});
   if(ownerError){await sdk.auth.signOut({scope:'local'});throw Error('该邮箱尚未配置为工作台管理员，请先完成管理员设置。')}
   if(active){setEmail(user.email||'');setMessage('邮件链接已验证，请在下方设置新密码。');setPhase('password')}
 }catch(error){if(active){setMessage(error instanceof Error?error.message:'验证失败，请重试。');setPhase('error')}}}initialize();return()=>{active=false}},[]);
 async function sendEmail(e:React.FormEvent){e.preventDefault();if(!client.current||busy)return;setBusy(true);setMessage('');try{
   const {error}=await client.current.auth.resetPasswordForEmail(email.trim(),{redirectTo:location.origin+'/reset-password'});
   if(error)throw Error('发送失败，请稍后重试；也可在 Supabase 用户详情中发送密码重设邮件。');
   setMessage('如该邮箱已注册，你将收到密码重设邮件。请打开最新邮件中的链接，留意垃圾邮件文件夹。');
 }catch(error){setMessage(error instanceof Error?error.message:'发送失败。')}finally{setBusy(false)}}
 async function savePassword(e:React.FormEvent){e.preventDefault();if(busy||!client.current)return;
   if(password.length<12){setMessage('请设置至少12位的新密码。');return}if(password!==confirm){setMessage('两次输入的密码不一致。');return}
   setBusy(true);setMessage('');try{
   const {error}=await client.current.auth.updateUser({password});
   if(error)throw Error('未能保存密码。请确认密码符合项目要求；若链接已过期，请重新发送邮件。');
   setPassword('');setConfirm('');tokens.current=null;try{await client.current.auth.signOut({scope:'local'})}catch{}
   setPhase('complete');setMessage('密码已设置，请返回登录页面，用你的邮箱和新密码登录。');
 }catch(error){setMessage(error instanceof Error?error.message:'保存失败，请重试。')}finally{setBusy(false)}}
 return <main className="reset-wrap"><style>{`
*{box-sizing:border-box}body{margin:0;background:#F8F4EE;color:#513B2B;font:14px/1.8 'Segoe UI','Microsoft YaHei',sans-serif}.reset-wrap{min-height:100vh;display:grid;place-items:center;padding:24px}.reset-card{width:100%;max-width:470px;padding:34px;background:#FFFCF7;border:1px solid #E6D8C6;border-radius:15px}h1{font-size:23px;line-height:1.5;margin:0 0 12px}.reset-card p{color:#826B54}.reset-card form{display:grid;gap:18px;margin:24px 0}.reset-card label{display:grid;gap:8px;color:#71543C}.reset-card input,.reset-card button{font:inherit;border-radius:7px;padding:12px;width:100%}.reset-card input{border:1px solid #DDCBB4;background:#FFFDF9;color:#513B2B}.reset-card input:focus{outline:2px solid #938D58;outline-offset:2px}.reset-card button{background:#A14B24;color:#FFF9F0;border:0;cursor:pointer}.reset-card button:disabled{opacity:.65;cursor:wait}.reset-message{min-height:28px;overflow-wrap:anywhere}.reset-card a{color:#8E4F2E}.reset-small{font-size:12px}.reset-success{color:#716D3E!important}
`}</style><section className="reset-card"><h1>阿雪的工作台 · 设置密码</h1>
{phase==='loading'&&<p role="status">正在验证邮件链接…</p>}
{phase==='request'&&<><p>填写你的工作台登录邮箱，收取设置新密码的邮件。</p><form onSubmit={sendEmail}><label>工作台邮箱<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} maxLength={254}/></label><button disabled={busy}>{busy?'正在发送…':'发送密码重设邮件'}</button></form></>}
{phase==='password'&&<><p className="reset-small">已验证邮箱：{email}</p><form onSubmit={savePassword}><label>新密码<input type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={password} onChange={e=>setPassword(e.target.value)}/></label><label>再次输入新密码<input type="password" autoComplete="new-password" required minLength={12} maxLength={256} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={busy}>{busy?'正在保存…':'保存新密码'}</button></form></>}
{phase==='error'&&<p><a href="/reset-password">重新发送密码重设邮件</a></p>}
<p role="status" aria-live="polite" className={'reset-message '+(phase==='complete'?'reset-success':'')}>{message}</p>
<p><a href="/login">返回登录</a></p><p className="reset-small">密码只需在此页面填写，不要发送到聊天中。这里设置的是工作台账号密码。</p>
</section></main>
}
