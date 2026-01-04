<<<<<<< HEAD
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function Relatorios() {
  const router = useRouter()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [busca, setBusca] = useState('')

  /* ---------- CARREGAR ALUNOS ---------- */
  async function carregarAlunos() {
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
      .eq('ativo', true)
      .order('nome')

    if (!error && data) {
      setAlunos(data)
    }
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  /* ---------- REGISTRAR AULA ---------- */
  async function registrarAula(aluno: Aluno, status: 'veio' | 'faltou') {
    if (aluno.aulas_restantes <= 0) {
      alert('Este plano já chegou ao limite de aulas.')
      return
    }

    const hoje = new Date()
    const dataLocal = new Date(
      hoje.getTime() - hoje.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10)

    await supabase.from('aulas').insert({
      aluno_id: aluno.id,
      data: dataLocal,
      status
    })

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.aulas_restantes - 1
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }

  /* ---------- DESFAZER ÚLTIMA ---------- */
  async function desfazerUltimaAula(aluno: Aluno) {
    const { data: ultima } = await supabase
      .from('aulas')
      .select('*')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!ultima) {
      alert('Nenhuma aula para desfazer')
      return
    }

    await supabase.from('aulas').delete().eq('id', ultima.id)

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.aulas_restantes + 1
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }

  /* ---------- REINICIAR PLANO ---------- */
  async function reiniciarPlano(aluno: Aluno) {
    await supabase.from('reinicios_plano').insert({
      aluno_id: aluno.id,
      total_aulas_anterior: aluno.total_aulas,
      aulas_restantes_anterior: aluno.aulas_restantes
    })

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.total_aulas
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }

  /* ---------- EDITAR DADOS DO ALUNO ---------- */
  async function editarAluno(aluno: Aluno) {
    const novoPlano = prompt('Plano:', aluno.plano)
    const novoValor = prompt('Valor do plano:', String(aluno.valor_plano))
    const novoTotal = prompt('Total de aulas:', String(aluno.total_aulas))
    const novoPagouEm = prompt(
      'Informação de pagamento (ex: 3x em julho, Pix dia 05):',
      aluno.pagou_em || ''
    )

    if (!novoPlano || !novoValor || !novoTotal) return

    const diferenca = Number(novoTotal) - aluno.total_aulas

    await supabase
      .from('alunos')
      .update({
        plano: novoPlano,
        valor_plano: Number(novoValor),
        total_aulas: Number(novoTotal),
        aulas_restantes: aluno.aulas_restantes + diferenca,
        pagou_em: novoPagouEm || null
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }
  /* ---------- DESFAZER REINÍCIO ---------- */
async function desfazerReinicio(aluno: Aluno) {
  const { data, error } = await supabase
    .from('reinicios_plano')
    .select('*')
    .eq('aluno_id', aluno.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    alert('Nenhum reinício para desfazer.')
    return
  }

  await supabase
    .from('alunos')
    .update({
      total_aulas: data.total_aulas_anterior,
      aulas_restantes: data.aulas_restantes_anterior
    })
    .eq('id', aluno.id)

  await supabase
    .from('reinicios_plano')
    .delete()
    .eq('id', data.id)

  carregarAlunos()
}


  /* ---------- FILTRO ---------- */
  const filtrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  /* ================== JSX ================== */

  return (
    <div className="container">
      <div className="topo">
        <img src="/logo-lk-pilates.png" className="logo" />
        
      </div>

      <h1>Relatório de Alunos</h1>

      <input
        className="search"
        placeholder="Pesquisar aluno..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {filtrados.map(aluno => (
        <div key={aluno.id} className="card">
          {/* DATAS */}
          <div className="datas-container">
            {aluno.aulas.map(aula => (
              <span
                key={aula.id}
                className={`data-badge ${aula.status}`}
              >
                {formatarDataBR(aula.data)}
              </span>
            ))}
          </div>

          <strong>{aluno.nome}</strong>

          <p><b>Plano:</b> {aluno.plano}</p>
          <p><b>Aulas:</b> {aluno.aulas_restantes} / {aluno.total_aulas}</p>
          <p><b>Valor:</b> R$ {aluno.valor_plano}</p>
          <p><b>Pagamento:</b> {aluno.pagou_em || '—'}</p>

          <div className="botoes">
            <button className="btn btn-veio" onClick={() => registrarAula(aluno, 'veio')}>
              Veio
            </button>

            <button className="btn btn-faltou" onClick={() => registrarAula(aluno, 'faltou')}>
              Faltou
            </button>

            <button className="btn btn-sec" onClick={() => desfazerUltimaAula(aluno)}>
              Desfazer última aula
            </button>

            <button className="btn btn-sec" onClick={() => reiniciarPlano(aluno)}>
              Reiniciar plano
            </button>
            <button
  className="btn btn-sec"
  onClick={() => router.push(`/relatorios/${aluno.id}`)}
>
  Ver relatório completo
</button>

            <button
  className="btn btn-sec"
  onClick={() => desfazerReinicio(aluno)}
>
  Desfazer reinício
</button>


            <button className="btn btn-sec" onClick={() => editarAluno(aluno)}>
              Editar dados
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
=======
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

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

export default function Relatorios() {
  const router = useRouter()

  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [busca, setBusca] = useState('')

  /* ---------- CARREGAR ALUNOS ---------- */
  async function carregarAlunos() {
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
      .eq('ativo', true)
      .order('nome')

    if (!error && data) {
      setAlunos(data)
    }
  }

  useEffect(() => {
    carregarAlunos()
  }, [])

  /* ---------- REGISTRAR AULA ---------- */
  async function registrarAula(aluno: Aluno, status: 'veio' | 'faltou') {
    if (aluno.aulas_restantes <= 0) {
      alert('Este plano já chegou ao limite de aulas.')
      return
    }

    const hoje = new Date()
    const dataLocal = new Date(
      hoje.getTime() - hoje.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 10)

    await supabase.from('aulas').insert({
      aluno_id: aluno.id,
      data: dataLocal,
      status
    })

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.aulas_restantes - 1
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }

  /* ---------- DESFAZER ÚLTIMA ---------- */
  async function desfazerUltimaAula(aluno: Aluno) {
    const { data: ultima } = await supabase
      .from('aulas')
      .select('*')
      .eq('aluno_id', aluno.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!ultima) {
      alert('Nenhuma aula para desfazer')
      return
    }

    await supabase.from('aulas').delete().eq('id', ultima.id)

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.aulas_restantes + 1
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }

  /* ---------- REINICIAR PLANO ---------- */
  async function reiniciarPlano(aluno: Aluno) {
    await supabase.from('reinicios_plano').insert({
      aluno_id: aluno.id,
      total_aulas_anterior: aluno.total_aulas,
      aulas_restantes_anterior: aluno.aulas_restantes
    })

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.total_aulas
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }

  /* ---------- EDITAR DADOS DO ALUNO ---------- */
  async function editarAluno(aluno: Aluno) {
    const novoPlano = prompt('Plano:', aluno.plano)
    const novoValor = prompt('Valor do plano:', String(aluno.valor_plano))
    const novoTotal = prompt('Total de aulas:', String(aluno.total_aulas))
    const novoPagouEm = prompt(
      'Informação de pagamento (ex: 3x em julho, Pix dia 05):',
      aluno.pagou_em || ''
    )

    if (!novoPlano || !novoValor || !novoTotal) return

    const diferenca = Number(novoTotal) - aluno.total_aulas

    await supabase
      .from('alunos')
      .update({
        plano: novoPlano,
        valor_plano: Number(novoValor),
        total_aulas: Number(novoTotal),
        aulas_restantes: aluno.aulas_restantes + diferenca,
        pagou_em: novoPagouEm || null
      })
      .eq('id', aluno.id)

    carregarAlunos()
  }
  /* ---------- DESFAZER REINÍCIO ---------- */
async function desfazerReinicio(aluno: Aluno) {
  const { data, error } = await supabase
    .from('reinicios_plano')
    .select('*')
    .eq('aluno_id', aluno.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    alert('Nenhum reinício para desfazer.')
    return
  }

  await supabase
    .from('alunos')
    .update({
      total_aulas: data.total_aulas_anterior,
      aulas_restantes: data.aulas_restantes_anterior
    })
    .eq('id', aluno.id)

  await supabase
    .from('reinicios_plano')
    .delete()
    .eq('id', data.id)

  carregarAlunos()
}


  /* ---------- FILTRO ---------- */
  const filtrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  /* ================== JSX ================== */

  return (
    <div className="container">
      <div className="topo">
        <img src="/logo-lk-pilates.png" className="logo" />
        
      </div>

      <h1>Relatório de Alunos</h1>

      <input
        className="search"
        placeholder="Pesquisar aluno..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {filtrados.map(aluno => (
        <div key={aluno.id} className="card">
          {/* DATAS */}
          <div className="datas-container">
            {aluno.aulas.map(aula => (
              <span
                key={aula.id}
                className={`data-badge ${aula.status}`}
              >
                {formatarDataBR(aula.data)}
              </span>
            ))}
          </div>

          <strong>{aluno.nome}</strong>

          <p><b>Plano:</b> {aluno.plano}</p>
          <p><b>Aulas:</b> {aluno.aulas_restantes} / {aluno.total_aulas}</p>
          <p><b>Valor:</b> R$ {aluno.valor_plano}</p>
          <p><b>Pagamento:</b> {aluno.pagou_em || '—'}</p>

          <div className="botoes">
            <button className="btn btn-veio" onClick={() => registrarAula(aluno, 'veio')}>
              Veio
            </button>

            <button className="btn btn-faltou" onClick={() => registrarAula(aluno, 'faltou')}>
              Faltou
            </button>

            <button className="btn btn-sec" onClick={() => desfazerUltimaAula(aluno)}>
              Desfazer última aula
            </button>

            <button className="btn btn-sec" onClick={() => reiniciarPlano(aluno)}>
              Reiniciar plano
            </button>
            <button
  className="btn btn-sec"
  onClick={() => router.push(`/relatorios/${aluno.id}`)}
>
  Ver relatório completo
</button>

            <button
  className="btn btn-sec"
  onClick={() => desfazerReinicio(aluno)}
>
  Desfazer reinício
</button>


            <button className="btn btn-sec" onClick={() => editarAluno(aluno)}>
              Editar dados
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
>>>>>>> e75c32708d0bc9ffbd16ba554dddf4c2db3fdcd0
