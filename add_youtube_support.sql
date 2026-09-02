-- دعم فيديوهات يوتيوب Unlisted
alter table public.lessons add column if not exists youtube_url text;
-- اجعل video_url و youtube_url اختياريين - واحد منهم يكفي
-- لا حاجة لتغيير constraints

select 'youtube_url added to lessons' as status;
