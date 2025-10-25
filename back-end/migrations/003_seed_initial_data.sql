-- ============================================
-- RaioX Recognize - Seed Initial Data
-- ============================================
-- Description: Insert initial data for development and testing
-- Author: Claude Code
-- Date: 2025-01-25
-- ============================================

-- ============================================
-- 1. CREATE ADMIN USER
-- ============================================

-- Insert admin user with default password: Admin@123
-- IMPORTANT: Change this password in production!
INSERT INTO usuarios (nome, email, senha_hash, role, ativo)
VALUES (
  'Administrador',
  'admin@raiox.com',
  -- Password: Admin@123 (bcrypt hash with cost 10)
  -- Generate with: bcrypt.hash('Admin@123', 10)
  '$2b$10$rK7qK8YqP.vY5EqYqP.vYuO7qK8YqP.vY5EqYqP.vYuO7qK8YqP.vY', -- Placeholder, replace with real hash
  'admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample doctor
INSERT INTO usuarios (nome, email, senha_hash, role, ativo)
VALUES (
  'Dr. João Silva',
  'joao.silva@raiox.com',
  -- Password: Doctor@123
  '$2b$10$rK7qK8YqP.vY5EqYqP.vYuO7qK8YqP.vY5EqYqP.vYuO7qK8YqP.vY', -- Placeholder, replace with real hash
  'doctor',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Insert sample nurse
INSERT INTO usuarios (nome, email, senha_hash, role, ativo)
VALUES (
  'Enfermeira Maria Santos',
  'maria.santos@raiox.com',
  -- Password: Nurse@123
  '$2b$10$rK7qK8YqP.vY5EqYqP.vYuO7qK8YqP.vY5EqYqP.vYuO7qK8YqP.vY', -- Placeholder, replace with real hash
  'nurse',
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 2. CREATE SAMPLE PATIENTS (optional for testing)
-- ============================================

INSERT INTO pacientes (nome, cpf, data_nascimento, sexo, telefone)
VALUES
  (
    'Paciente Teste 1',
    '12345678901',
    '1980-05-15',
    'M',
    '11987654321'
  ),
  (
    'Paciente Teste 2',
    '98765432109',
    '1975-08-22',
    'F',
    '11912345678'
  )
ON CONFLICT (cpf) DO NOTHING;

-- ============================================
-- 3. CREATE SAMPLE CLASSIFICATION DATA
-- ============================================

-- This is useful for validation and autocomplete features
-- You can add more classifications as your knowledge base grows

-- Commented out by default - uncomment if you want sample data
/*
INSERT INTO lesoes (file_name, description, embedding, classificacao, localizacao, severidade, notas)
VALUES
  (
    'sample_melanoma.jpg',
    'Lesão pigmentada assimétrica com bordas irregulares e múltiplas cores',
    array_fill(0.0, ARRAY[1536])::vector(1536), -- Placeholder embedding
    'melanoma_maligno',
    'braco',
    'grave',
    'Caso de exemplo para treinamento'
  ),
  (
    'sample_carcinoma.jpg',
    'Lesão com superfície ulcerada e bordas elevadas perláceas',
    array_fill(0.0, ARRAY[1536])::vector(1536), -- Placeholder embedding
    'carcinoma_basocelular',
    'rosto',
    'moderado',
    'Caso de exemplo para treinamento'
  ),
  (
    'sample_nevo.jpg',
    'Lesão pigmentada regular com bordas bem definidas',
    array_fill(0.0, ARRAY[1536])::vector(1536), -- Placeholder embedding
    'nevo_benigno',
    'costas',
    'leve',
    'Caso de exemplo para treinamento'
  )
ON CONFLICT (sha256) DO NOTHING;
*/

-- ============================================
-- 4. HELPER VIEWS FOR DEVELOPMENT
-- ============================================

-- View to show all users (without password hash)
CREATE OR REPLACE VIEW vw_usuarios_publicos AS
SELECT
  id,
  nome,
  email,
  role,
  ativo,
  ultimo_login,
  criado_em
FROM usuarios;

-- ============================================
-- 5. USEFUL QUERIES FOR SETUP VALIDATION
-- ============================================

-- Check created users
DO $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM usuarios;
  RAISE NOTICE '👥 Usuários criados: %', user_count;
END $$;

-- Check created patients
DO $$
DECLARE
  patient_count INT;
BEGIN
  SELECT COUNT(*) INTO patient_count FROM pacientes;
  RAISE NOTICE '🏥 Pacientes criados: %', patient_count;
END $$;

-- ============================================
-- NOTES
-- ============================================

/*
IMPORTANT SECURITY NOTES:

1. PASSWORD HASHES:
   - The password hashes above are PLACEHOLDERS
   - You MUST replace them with real bcrypt hashes
   - Use bcrypt with cost factor of 10 or higher
   - Never commit real password hashes to version control

2. HOW TO GENERATE REAL PASSWORD HASHES:

   Using Node.js (recommended):
   ```javascript
   const bcrypt = require('bcrypt');
   const hash = await bcrypt.hash('YourPassword123', 10);
   console.log(hash);
   ```

   Using online tool (not recommended for production):
   https://bcrypt-generator.com/

3. DEFAULT CREDENTIALS:
   - Admin: admin@raiox.com / Admin@123
   - Doctor: joao.silva@raiox.com / Doctor@123
   - Nurse: maria.santos@raiox.com / Nurse@123

   CHANGE THESE IN PRODUCTION!

4. FIRST LOGIN:
   After first login, users should be required to change their password

5. SAMPLE DATA:
   The sample lesoes data uses placeholder embeddings (zeros)
   Replace with real embeddings from OpenAI API for actual use
*/

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Dados iniciais inseridos com sucesso!';
  RAISE NOTICE '🔐 IMPORTANTE: Altere as senhas padrão antes de usar em produção!';
  RAISE NOTICE '👤 Use admin@raiox.com para fazer login inicial';
END $$;
