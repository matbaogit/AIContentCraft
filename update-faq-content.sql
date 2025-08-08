-- Update FAQ content to replace "SEO AI Writer" with "ToolBox"
-- Run this script to update existing FAQ data in the database

UPDATE faqs 
SET 
  question_vi = REPLACE(question_vi, 'SEO AI Writer', 'ToolBox'),
  answer_vi = REPLACE(answer_vi, 'SEO AI Writer', 'ToolBox'),
  question_en = REPLACE(question_en, 'SEO AI Writer', 'ToolBox'),
  answer_en = REPLACE(answer_en, 'SEO AI Writer', 'ToolBox'),
  updated_at = NOW()
WHERE 
  question_vi LIKE '%SEO AI Writer%' 
  OR answer_vi LIKE '%SEO AI Writer%' 
  OR question_en LIKE '%SEO AI Writer%' 
  OR answer_en LIKE '%SEO AI Writer%';

-- Check the updated results
SELECT id, question_vi, question_en FROM faqs ORDER BY "order";