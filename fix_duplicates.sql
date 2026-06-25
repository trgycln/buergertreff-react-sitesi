-- Fazla/kopya kategorileri tespit edip, icindeki islemleri asil kategoriye tasir ve kopyalari gizler.

WITH category_duplicates AS (
  SELECT 
    id,
    name,
    type,
    ROW_NUMBER() OVER(PARTITION BY LOWER(REPLACE(name, ' ', '')) ORDER BY id ASC) as row_num
  FROM accounting_categories
  WHERE is_active = true
),
main_categories AS (
  SELECT id, LOWER(REPLACE(name, ' ', '')) as norm_name
  FROM category_duplicates
  WHERE row_num = 1
),
duplicate_categories AS (
  SELECT cd.id as dup_id, mc.id as main_id
  FROM category_duplicates cd
  JOIN main_categories mc ON LOWER(REPLACE(cd.name, ' ', '')) = mc.norm_name
  WHERE cd.row_num > 1
)
UPDATE accounting_transactions
SET category_id = duplicate_categories.main_id
FROM duplicate_categories
WHERE accounting_transactions.category_id = duplicate_categories.dup_id;

WITH category_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER(PARTITION BY LOWER(REPLACE(name, ' ', '')) ORDER BY id ASC) as row_num
  FROM accounting_categories
  WHERE is_active = true
)
UPDATE accounting_categories
SET is_active = false
WHERE id IN (SELECT id FROM category_duplicates WHERE row_num > 1);
