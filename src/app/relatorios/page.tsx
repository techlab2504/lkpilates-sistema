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
        aulas: aulas (
          id,
          data,
          status
        )
      `)
      .eq('ativo', true)
      .order('nome')

    if (error) {
      console.error(error)
      return
    }

    const alunosOrdenados = (data || []).map(aluno => ({
      ...aluno,
      aulas: [...(aluno.aulas || [])].sort(
        (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
      )
    }))

    setAlunos(alunosOrdenados)
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
      .update({ aulas_restantes: aluno.aulas_restantes - 1 })
      .eq('id', aluno.id)

    await carregarAlunos()
  }

  /* ---------- DESFAZER ÚLTIMA AULA ---------- */
  async function desfazerUltimaAula(aluno: Aluno) {
    const { data: ultimaAula } = await supabase
      .from('aulas')
      .select('id')
      .eq('aluno_id', aluno.id)
      .order('data', { ascending: false }) // ✅ CORRETO
      .limit(1)
      .single()

    if (!ultimaAula) {
      alert('Nenhuma aula para desfazer')
      return
    }

    await supabase.from('aulas').delete().eq('id', ultimaAula.id)

    await supabase
      .from('alunos')
      .update({ aulas_restantes: aluno.aulas_restantes + 1 })
      .eq('id', aluno.id)

    await carregarAlunos()
  }

  /* ---------- REINICIAR PLANO (DEFINITIVO) ---------- */
  async function reiniciarPlano(aluno: Aluno) {
    const confirmar = confirm(
      `Deseja reiniciar o plano de ${aluno.nome}?\n\nApenas o número de aulas será reiniciado.`
    )

    if (!confirmar) return

    await supabase
      .from('alunos')
      .update({
        aulas_restantes: aluno.total_aulas
      })
      .eq('id', aluno.id)

    await carregarAlunos()
  }

  /* ---------- EDITAR / APAGAR DATA ---------- */
  async function editarDataAula(aula: Aula, aluno: Aluno) {
    const acao = prompt(
      'O que deseja fazer?\n\n1 - Alterar data\n2 - Apagar esta data'
    )

    if (!acao) return

    if (acao === '2') {
      const confirmar = confirm('Deseja realmente apagar esta data?')
      if (!confirmar) return

      await supabase.from('aulas').delete().eq('id', aula.id)

      await supabase
        .from('alunos')
        .update({ aulas_restantes: aluno.aulas_restantes + 1 })
        .eq('id', aluno.id)

      await carregarAlunos()
      return
    }

    if (acao === '1') {
      const novaData = prompt(
        'Digite a nova data (AAAA-MM-DD):',
        aula.data.slice(0, 10)
      )

      if (!novaData) return

      if (!/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
        alert('Formato inválido.')
        return
      }

      await supabase
        .from('aulas')
        .update({ data: `${novaData}T00:00:00` })
        .eq('id', aula.id)

      await carregarAlunos()
    }
  }

  /* ---------- EDITAR DADOS ---------- */
  async function editarAluno(aluno: Aluno) {
    const novoPlano = prompt('Plano:', aluno.plano)
    const novoValor = prompt('Valor do plano:', String(aluno.valor_plano))
    const novoTotal = prompt('Total de aulas:', String(aluno.total_aulas))
    const novoPagouEm = prompt(
      'Pagamento:',
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

    await carregarAlunos()
  } 
  /* ---------- CORRIGIR AULAS RESTANTES ---------- */
  async function corrigirAulas(aluno: Aluno) {
  const novoValor = prompt(
    `Corrigir aulas restantes de ${aluno.nome}\n\nTotal: ${aluno.total_aulas}\nAtual: ${aluno.aulas_restantes}`,
    String(aluno.aulas_restantes)
  )

  if (novoValor === null) return

  const numero = Number(novoValor)

  if (
    isNaN(numero) ||
    numero < 0 ||
    numero > aluno.total_aulas
  ) {
    alert('Número inválido')
    return
  }

  const { error } = await supabase
    .from('alunos')
    .update({
      aulas_restantes: numero
    })
    .eq('id', aluno.id)

  if (error) {
    alert('Erro ao corrigir aulas')
    return
  }

  await carregarAlunos()
}


  /* ---------- APAGAR FICHA ---------- */
  async function apagarFicha(aluno: Aluno) {
    const confirmacao = confirm(
      `Tem certeza que deseja apagar a ficha de ${aluno.nome}?`
    )

    if (!confirmacao) return

    await supabase.from('aulas').delete().eq('aluno_id', aluno.id)
    await supabase.from('alunos').update({ ativo: false }).eq('id', aluno.id)

    await carregarAlunos()
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

          <div className="datas-container">
            {aluno.aulas.map(aula => (
              <span
                key={aula.id}
                className={`data-badge ${aula.status}`}
                onClick={() => editarDataAula(aula, aluno)}
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
  <button
    className="btn btn-veio"
    onClick={() => registrarAula(aluno, 'veio')}
  >
    Veio
  </button>

  <button
    className="btn btn-faltou"
    onClick={() => registrarAula(aluno, 'faltou')}
  >
    Faltou
  </button>

  <button
    className="btn btn-sec"
    onClick={() => desfazerUltimaAula(aluno)}
  >
    Desfazer última
  </button>

  <button
    className="btn btn-sec"
    onClick={() => reiniciarPlano(aluno)}
  >
    Reiniciar plano
  </button>

  <button
    className="btn btn-sec"
    onClick={() => editarAluno(aluno)}
  >
    Editar dados
  </button>

  <button
    className="btn btn-sec"
    onClick={() => router.push(`/relatorios/${aluno.id}`)}
  >
    Ver relatório completo
  </button>
  <button
  className="btn btn-sec"
  onClick={() => corrigirAulas(aluno)}
>
  Corrigir aulas
</button>


  <button
    className="btn btn-danger"
    onClick={() => apagarFicha(aluno)}
  >
    Apagar ficha
  </button>
</div>

        </div>
      ))}
    </div>
  )
}
