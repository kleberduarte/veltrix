import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, 'sample-data')
fs.mkdirSync(outDir, { recursive: true })

const cats = ['Calcados', 'Roupas', 'Acessorios', 'Equipamentos']
const rows = [['nome', 'preco', 'estoque', 'codigoProduto', 'categoria', 'descricao']]

for (let i = 1; i <= 500; i++) {
  const cod = `ADS-${String(i).padStart(5, '0')}`
  const nome = `Adidas ${String(i).padStart(3, '0')} - Catalogo`
  const preco = (29.9 + ((i * 3.17) % 470)).toFixed(2)
  const est = (i * 11) % 500
  const cat = cats[i % 4]
  const desc = `Massa teste empresa Adidas - item ${i}`
  rows.push([nome, preco, String(est), cod, cat, desc])
}

const esc = (s) => {
  const t = String(s)
  if (/[;"\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`
  return t
}

const lines = rows.map((r) => r.map(esc).join(';')).join('\r\n')
const outFile = path.join(outDir, 'produtos-adidas-500.csv')
fs.writeFileSync(outFile, '\ufeff' + lines, 'utf8')
console.log('Gerado:', outFile)
