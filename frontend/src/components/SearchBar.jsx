import React from 'react'
import { useStore } from '../state/useStore'
export default function SearchBar(){
  const { filters, setFilter, loadChampions } = useStore()
  return (
    <div style={{display:'flex',gap:8}}>
      <input placeholder='Search champion...' value={filters.q} onChange={e=>setFilter('q', e.target.value)} />
      <input placeholder='Tag (e.g., Fighter)' value={filters.tag} onChange={e=>setFilter('tag', e.target.value)} />
      <button onClick={loadChampions}>Search</button>
    </div>
  )
}