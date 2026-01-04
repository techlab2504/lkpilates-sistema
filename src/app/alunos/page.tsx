'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Alunos() {
  const [nome, setNome] = useState('')
  const [plano, setPlano] = useState('')
  const [total, setTotal] = useState(0)
  const [valor, setValor] = useState(0)
  const [pagouEm, setPagouEm] = useState('')

  async function salvar() {
    if (!nome || !plano || total <= 0) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const { error } = await supabase.from('alunos').insert({
      nome,
      plano,
      valor_plano: valor,
      total_aulas: total,
      aulas_restantes: total,
      pagou_em: total,
      ativo: true
    })

    if (error) {
      console.error(error)
      alert('Erro ao cadastrar aluno')
      return
    }

    alert('Aluno cadastrado com sucesso')

    // limpar formulário
    setNome('')
    setPlano('')
    setTotal(0)
    setValor(0)
    setPagouEm('')
  }

  return (
    <div className="form-container">
      <img
        src="/logo-lk-pilates.png"
        alt="LK Pilates"
        className="form-logo"
      />

      <h1 className="form-title">Cadastro de Alunos</h1>
      <p className="form-subtitle">
        Preencha os dados do aluno para iniciar o plano
      </p>

      <div className="form-card">
        <input
          className="input"
          placeholder="Nome do aluno"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />

        <input
          className="input"
          placeholder="Plano (ex: mensal, semestral)"
          value={plano}
          onChange={e => setPlano(e.target.value)}
        />

        <input
          className="input"
          type="number"
          placeholder="Total de aulas"
          value={total || ''}
          onChange={e => setTotal(+e.target.value)}
        />

        <input
          className="input"
          type="number"
          placeholder="Valor do plano (R$)"
          value={valor || ''}
          onChange={e => setValor(+e.target.value)}
        />

        {/* NOVO CAMPO */}
        <label className="label">
          Pagou em:
        </label>
        <input
          className="input"
          type="text"
          value={pagouEm}
          onChange={e => setPagouEm(e.target.value)}
        />

        <button className="btn-primary" onClick={salvar}>
          Salvar aluno
        </button>
      </div>
    </div>
  )
}
