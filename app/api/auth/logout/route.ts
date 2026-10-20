import {sessionClient} from '../../../../lib/supabase';
import {json,sameOrigin} from '../../../../lib/http';
export async function POST(request:Request){if(!sameOrigin(request))return json({error:'请求来源无效'},403);try{await(await sessionClient()).auth.signOut({scope:'local'});return json({ok:true})}catch{return json({error:'退出失败，请重试'},503)}}
