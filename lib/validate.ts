function string(value: unknown, max: number) { return typeof value === 'string' ? value.slice(0, max) : ''; }
export function validateState(raw: any) {
  if (!raw || !Array.isArray(raw.tasks) || raw.tasks.length > 10000) throw new Error('最多支持10000项任务');
  const ids = new Set<string>();
  const tasks = raw.tasks.map((t: any) => {
    if (!t || typeof t.title !== 'string' || !t.title.trim() || !['todo','doing','done'].includes(t.status)) throw new Error('任务格式无效');
    const id = string(t.id, 100); if (!id || ids.has(id)) throw new Error('任务编号缺失或重复'); ids.add(id);
    const task: any = { id, title: t.title.trim().slice(0,120), status: t.status, priority: t.priority === '高优先级' ? t.priority : '普通' };
    for (const [key, max] of Object.entries({cat1:50,cat2:50,cat3:50,project:180,notes:5000,contact:80,contactInfo:160,planWindow:200})) task[key] = string(t[key],max);
    task.due = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(t.due) ? t.due : '';
    task.completedAt = t.status === 'done' && typeof t.completedAt === 'string' && Number.isFinite(Date.parse(t.completedAt)) ? t.completedAt : null;
    task.planSource = t.planSource === 'wedding-full-plan-v1' ? t.planSource : '';
    for (const key of ['startOffset','endOffset']) task[key] = Number.isInteger(t[key]) && Math.abs(t[key]) <= 10000 ? t[key] : null;
    return task;
  });
  return { tasks, weddingDate: /^\d{4}-\d{2}-\d{2}$/.test(raw.weddingDate) ? raw.weddingDate : '' };
}
