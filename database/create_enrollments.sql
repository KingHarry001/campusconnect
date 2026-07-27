-- STEP 1: Find this lecturer's user ID and their courses' current session/semester
select
  u.id as lecturer_id,
  u.full_name,
  u.email,
  c.id as course_id,
  c.code,
  c.title,
  c.session as course_session,
  c.semester as course_semester
from users u
left join courses c on c.lecturer_id = u.id
where u.email = 'nexus.desig@oouagoiwoye.edu.ng';