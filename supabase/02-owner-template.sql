-- 这是模板。等指导创建好工作台登录账号后，再替换下面的邮箱并执行。
-- 邮箱不是数据库密码。这里不要填写任何密码或 API 密钥。
do $$
declare target_id uuid;
begin
 select id into target_id from auth.users where lower(email)=lower('请替换为你的工作台登录邮箱');
 if target_id is null then raise exception '未找到该邮箱的账号，请先在 Authentication → Users 中创建用户。'; end if;
 insert into axue_private.workbench_owners(user_id) values(target_id) on conflict(user_id) do nothing;
end;$$;
