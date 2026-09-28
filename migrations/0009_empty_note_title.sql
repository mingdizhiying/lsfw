-- Remove the observed legacy automatic title; keep all other titles intact.
UPDATE entries SET title='' WHERE id='162edfbe-2e8d-40bd-933a-e89f056e410d' AND kind='note' AND title='随手记';
