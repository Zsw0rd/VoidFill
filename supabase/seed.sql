insert into public.skills (name, category, description) values
  ('Python Basics', 'Programming', 'Syntax, control flow, functions'),
  ('SQL Fundamentals', 'Data', 'Select, joins, aggregation'),
  ('Data Visualization', 'Data', 'Charts, storytelling, dashboards'),
  ('Web Fundamentals', 'Web', 'HTML/CSS/JS basics'),
  ('Git & Version Control', 'Tools', 'Branching, commits, PRs'),
  ('DSA Basics', 'CS', 'Arrays, stacks, queues, complexity')
on conflict (name) do nothing;

insert into public.roles (name, description) values
  ('Data Analyst', 'SQL + BI + basic Python'),
  ('Frontend Developer', 'Web fundamentals + JS + Git'),
  ('AI Applications Developer', 'Python + data handling + projects')
on conflict (name) do nothing;

with s as (select id,name from public.skills),
     r as (select id,name from public.roles)
insert into public.role_skills (role_id, skill_id, weight)
select r.id, s.id,
  case
    when r.name = 'Data Analyst' and s.name in ('SQL Fundamentals','Data Visualization') then 1.0
    when r.name = 'Data Analyst' and s.name = 'Python Basics' then 0.85
    when r.name = 'Frontend Developer' and s.name in ('Web Fundamentals','Git & Version Control') then 1.0
    when r.name = 'AI Applications Developer' and s.name in ('Python Basics','SQL Fundamentals') then 0.9
    else 0.75
  end
from r cross join s
where
  (r.name = 'Data Analyst' and s.name in ('SQL Fundamentals','Python Basics','Data Visualization','Git & Version Control'))
  or
  (r.name = 'Frontend Developer' and s.name in ('Web Fundamentals','Git & Version Control','DSA Basics'))
  or
  (r.name = 'AI Applications Developer' and s.name in ('Python Basics','SQL Fundamentals','Git & Version Control','DSA Basics','Data Visualization'))
on conflict do nothing;

with s as (select id,name from public.skills)
insert into public.skill_dependencies (prerequisite_skill_id, dependent_skill_id)
select a.id, b.id
from s a, s b
where (a.name,b.name) in (
  ('Python Basics','Data Visualization'),
  ('SQL Fundamentals','Data Visualization'),
  ('Git & Version Control','Web Fundamentals')
)
on conflict do nothing;

insert into public.questions (skill_id, prompt, options, correct_index, difficulty)
select s.id, q.prompt, q.options::jsonb, q.correct_index, q.difficulty
from public.skills s
join (values
  ('Python Basics','What does a function do in Python?','["Repeats code automatically","Groups reusable logic into a callable block","Stores images","Compiles the OS"]',1,1),
  ('Python Basics','Which is a valid Python list?','["(1,2,3)","{1,2,3}","[1,2,3]","<1,2,3>"]',2,1),
  ('SQL Fundamentals','Which clause filters rows after aggregation?','["WHERE","GROUP BY","HAVING","ORDER BY"]',2,2),
  ('SQL Fundamentals','What does JOIN do?','["Sorts data","Combines rows from tables","Deletes rows","Creates a DB"]',1,1),
  ('Data Visualization','Best chart for trend over time?','["Pie chart","Line chart","Scatter only","Radar"]',1,1),
  ('Web Fundamentals','What does CSS control?','["Database","Styling/layout","Server routing","CPU"]',1,1),
  ('Git & Version Control','What does git commit do?','["Uploads to cloud instantly","Records changes locally with a message","Deletes branch","Installs packages"]',1,1),
  ('DSA Basics','Big-O describes?','["Memory address","Time/space growth","UI styling","SQL joins"]',1,1),
  ('DSA Basics','Stack follows which order?','["FIFO","LIFO","Random","Sorted"]',1,1),
  ('Data Visualization','What improves readability most?','["More colors","Clear labels and scales","3D effects","Random axes"]',1,1)
) as q(skill_name,prompt,options,correct_index,difficulty)
on s.name = q.skill_name;
