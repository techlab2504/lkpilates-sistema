'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

/* ================== TIPOS ================== */

type Aula = {
  id: number
  data: string
  status: 'veio' | 'faltou'
}

type Aluno = {
  id: string
  nome: string
  plano: string
  total_aulas: number
  aulas_restantes: number
  valor_plano: number
  pagou_em: string | null
  aulas: Aula[]
}

/* ================== UTIL ================== */

function formatarDataBR(data: string) {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

/* ================== COMPONENTE ================== */

export default function RelatorioAluno() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const [aluno, setAluno] = useState<Aluno | null>(null)

  async function carregarAluno() {
    const { data, error } = await supabase
      .from('alunos')
      .select(`
        id,
        nome,
        plano,
        total_aulas,
        aulas_restantes,
        valor_plano,
        pagou_em,
        aulas (
          id,
          data,
          status
        )
      `)
      .eq('id', id)
      .single()

    if (!error && data) {
      setAluno(data)
    }
  }

  useEffect(() => {
    carregarAluno()
  }, [])

  if (!aluno) {
    return <p style={{ padding: 40 }}>Carregando relatório...</p>
  }

  const aulasVeio = aluno.aulas.filter(a => a.status === 'veio')
  const aulasFaltou = aluno.aulas.filter(a => a.status === 'faltou')

  return (
    <div className="container">
      <button className="btn-voltar" onClick={() => router.push('/relatorios')}>
        ← Voltar aos relatórios
      </button>

      <h1>Relatório do Aluno</h1>

      <div className="card">
        <h2>{aluno.nome}</h2>

        <p><b>Plano:</b> {aluno.plano}</p>
        <p><b>Valor:</b> R$ {aluno.valor_plano}</p>
        <p><b>Pagamento:</b> {aluno.pagou_em || '—'}</p>
        <p><b>Aulas restantes:</b> {aluno.aulas_restantes} / {aluno.total_aulas}</p>

        <hr />

        <h3>Presenças ({aulasVeio.length})</h3>
        {aulasVeio.length === 0 && <p>Nenhuma presença registrada.</p>}
        {aulasVeio.map(aula => (
          <span key={aula.id} className="data-badge veio">
            {formatarDataBR(aula.data)}
          </span>
        ))}

        <h3 style={{ marginTop: 20 }}>Faltas ({aulasFaltou.length})</h3>
        {aulasFaltou.length === 0 && <p>Nenhuma falta registrada.</p>}
        {aulasFaltou.map(aula => (
          <span key={aula.id} className="data-badge faltou">
            {formatarDataBR(aula.data)}
          </span>
        ))}
      </div>
    </div>
  )
}
