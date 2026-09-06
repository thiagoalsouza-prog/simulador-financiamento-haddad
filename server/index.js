import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não configurada. Defina a connection string do Neon nas variáveis de ambiente.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pacientes_simulador (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `)
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pacientes_simulador_nome ON pacientes_simulador (lower(nome));')
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pacientes_simulador_telefone ON pacientes_simulador (telefone);')
}

const app = express()
app.use(express.json())

app.post('/api/patients', async (req, res) => {
  const { name, phone } = req.body ?? {}

  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Nome é obrigatório.' })
  }

  const digits = typeof phone === 'string' ? phone.replace(/\D/g, '') : ''
  if (digits.length < 10 || digits.length > 11) {
    return res.status(400).json({ error: 'Informe um telefone válido, com DDD.' })
  }

  try {
    const result = await pool.query(
      'INSERT INTO pacientes_simulador (nome, telefone) VALUES ($1, $2) RETURNING id, nome, telefone, criado_em',
      [name.trim(), digits],
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Erro ao salvar paciente', err)
    res.status(500).json({ error: 'Erro ao salvar paciente.' })
  }
})

app.get('/api/patients', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  try {
    let result
    if (!q) {
      result = await pool.query(
        'SELECT id, nome, telefone, criado_em FROM pacientes_simulador ORDER BY criado_em DESC LIMIT 50',
      )
    } else {
      const digits = q.replace(/\D/g, '')
      result = await pool.query(
        `SELECT id, nome, telefone, criado_em FROM pacientes_simulador
         WHERE lower(nome) LIKE lower($1) OR ($2 <> '' AND telefone LIKE $2)
         ORDER BY criado_em DESC LIMIT 50`,
        [`%${q}%`, digits ? `%${digits}%` : ''],
      )
    }
    res.json(result.rows)
  } catch (err) {
    console.error('Erro ao buscar pacientes', err)
    res.status(500).json({ error: 'Erro ao buscar pacientes.' })
  }
})

const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const port = process.env.PORT || 8787

ensureSchema()
  .then(() => {
    app.listen(port, () => {
      console.log(`Servidor do simulador rodando na porta ${port}`)
    })
  })
  .catch((err) => {
    console.error('Falha ao preparar o banco de dados', err)
    process.exit(1)
  })
