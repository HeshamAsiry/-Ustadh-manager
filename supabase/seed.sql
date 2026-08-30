insert into public.subjects (name_ar, name_fr, name_en) values
('القرآن','Coran','Quran'),
('القراءة','Lecture','Reading'),
('العربية','Arabe','Arabic'),
('التجويد','Tajwid','Tajwid'),
('الحديث','Hadith','Hadith'),
('الفقه','Fiqh','Fiqh'),
('العقيدة','Aqida','Aqeedah'),
('إسلاميات','Études islamiques','Islamic studies')
on conflict do nothing;
