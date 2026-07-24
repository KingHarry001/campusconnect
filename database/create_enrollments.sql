drop policy if exists "enrollments_student_all" on public.enrollments;

-- Split into separate select/insert/delete for clearer control
create policy "enrollments_student_select" on public.enrollments
for select using (auth.uid() = student_id);

create policy "enrollments_student_insert" on public.enrollments
for insert
with check (
  auth.uid() = student_id
  and exists (
    select 1 from public.users u
    join public.courses c on c.level = u.level
    where u.id = auth.uid()
      and c.id = enrollments.course_id
      and u.role = 'student'
      and u.status = 'active'
  )
);

create policy "enrollments_student_delete" on public.enrollments
for delete using (auth.uid() = student_id);