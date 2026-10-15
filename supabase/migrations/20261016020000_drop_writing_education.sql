-- 글쓰기/콘텐츠, 교육/연구 카테고리 삭제 (Models에 해당 모델이 없어 사이드바에서 제거하기로 함, 2026-10-15)
-- 기사는 먼저 LLM 또는 AI/ML로 옮겼다. 혹시 남은 게 있으면 AI/ML로 보낸 뒤 카테고리 행을 지운다.
UPDATE articles SET category_id = (SELECT id FROM categories WHERE slug = 'ai-ml')
WHERE category_id IN (SELECT id FROM categories WHERE slug IN ('writing', 'education'));
DELETE FROM categories WHERE slug IN ('writing', 'education');
