-- Rode no MySQL (schema `veltrix`) quando aparecer:
-- "Detected failed migration to version 8" / "Validate failed"
--
-- 1) Falha na V8 (success = 0): apague o registro falho e suba o backend de novo.
DELETE FROM flyway_schema_history WHERE success = 0 AND version = '8';

-- 2) Se a V8 já tinha sido aplicada com sucesso e o arquivo V8 mudou (checksum):
--    mvn flyway:repair (com url/user/senha) OU apague a linha da V8 e rode o app
--    (só se souber que o estado do banco está ok — em geral use repair).
