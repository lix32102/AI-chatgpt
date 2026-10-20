import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
export function configuration(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error('CONFIGURATION_REQUIRED');
 const parsed=new URL(url);if(parsed.protocol!=='https:')throw new Error('CONFIGURATION_REQUIRED');
 return {url,key};
}
export async function sessionClient(){
 const {url,key}=configuration(),jar=await cookies();
 return createServerClient(url,key,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll(){return jar.getAll()},setAll(values){for(const {name,value,options} of values)jar.set(name,value,options)}}});
}
export async function requestClient(request:Request){
 if(request.headers.has('X-Workbench-Share')){const {url,key}=configuration();return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})}
 return sessionClient();
}
