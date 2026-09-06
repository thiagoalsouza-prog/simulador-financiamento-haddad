import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

let schemaReady

function ensureSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS pacientes_simulador (
          id SERIAL PRIMARY KEY,
          nome TEXT NOT NULL,
          telefone TEXT NOT NULL,
          criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `
      await sql`ALTER TABLE pacientes_simulador ADD COLUMN IF NOT EXISTS simulacao JSONB`
      await sql`ALTER TABLE pacientes_simulador ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()`
      await sql`CREATE INDEX IF NOT EXISTS idx_pacientes_simulador_nome ON pacientes_simulador (lower(nome))`
      await sql`CREATE INDEX IF NOT EXISTS idx_pacientes_simulador_telefone ON pacientes_simulador (telefone)`
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_pacientes_simulador_nome_telefone ON pacientes_simulador (lower(nome), telefone)`
    })().catch((err) => {
      schemaReady = undefined
      throw err
    })
  }
  return schemaReady
}

function isValidSimulation(simulation) {
  if (!simulation || typeof simulation !== 'object') return false
  const numberFields = ['valorTratamento', 'entrada', 'jurosMensalPct', 'parcelas', 'valorParcela', 'totalReceber']
  return numberFields.every((key) => typeof simulation[key] === 'number' && Number.isFinite(simulation[key]))
}

async function handlePost(req, res) {
  const { name, phone, simulation } = req.body ?? {}

  if (typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Nome é obrigatório.' })
    return
  }

  const digits = typeof phone === 'string' ? phone.replace(/\D/g, '') : ''
  if (digits.length < 10 || digits.length > 11) {
    res.status(400).json({ error: 'Informe um telefone válido, com DDD.' })
    return
  }

  const simulacao = isValidSimulation(simulation)
    ? JSON.stringify({
        tratamentoNome: typeof simulation.tratamentoNome === 'string' ? simulation.tratamentoNome : 'Personalizado',
        valorTratamento: simulation.valorTratamento,
        entrada: simulation.entrada,
        jurosMensalPct: simulation.jurosMensalPct,
        modo: simulation.modo === 'byInstallment' ? 'byInstallment' : 'byTerm',
        parcelas: simulation.parcelas,
        valorParcela: simulation.valorParcela,
        totalReceber: simulation.totalReceber,
      })
    : null

  try {
    const rows = await sql`
      INSERT INTO pacientes_simulador (nome, telefone, simulacao, atualizado_em)
      VALUES (${name.trim()}, ${digits}, ${simulacao}::jsonb, now())
      ON CONFLICT (lower(nome), telefone)
      DO UPDATE SET simulacao = EXCLUDED.simulacao, atualizado_em = now()
      RETURNING id, nome, telefone, simulacao, criado_em, atualizado_em
    `
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Erro ao salvar paciente', err)
    res.status(500).json({ error: 'Erro ao salvar paciente.' })
  }
}

async function handleGet(req, res) {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  try {
    let rows
    if (!q) {
      rows = await sql`
        SELECT id, nome, telefone, simulacao, criado_em, atualizado_em FROM pacientes_simulador
        ORDER BY atualizado_em DESC LIMIT 50
      `
    } else {
      const digits = q.replace(/\D/g, '')
      rows = await sql`
        SELECT id, nome, telefone, simulacao, criado_em, atualizado_em FROM pacientes_simulador
        WHERE lower(nome) LIKE lower(${'%' + q + '%'})
           OR (${digits} <> '' AND telefone LIKE ${'%' + digits + '%'})
        ORDER BY atualizado_em DESC LIMIT 50
      `
    }
    res.status(200).json(rows)
  } catch (err) {
    console.error('Erro ao buscar pacientes', err)
    res.status(500).json({ error: 'Erro ao buscar pacientes.' })
  }
}

export default async function handler(req, res) {
  if (!process.env.DATABASE_URL) {
    res.status(500).json({ error: 'DATABASE_URL não configurada.' })
    return
  }

  try {
    await ensureSchema()
  } catch (err) {
    console.error('Erro ao preparar o banco de dados', err)
    res.status(500).json({ error: 'Erro ao conectar ao banco de dados.' })
    return
  }

  if (req.method === 'POST') return handlePost(req, res)
  if (req.method === 'GET') return handleGet(req, res)

  res.status(405).json({ error: 'Método não permitido.' })
}
