// Downloads the es.wikipedia "Futbolistas del <club>" categories: everyone who played for the club,
// even briefly. The build adds that club to matching dataset players whose club list missed it.
// Output: data-sources/raw/wikipedia/club-categories.json { [dataset club name]: [page titles] }
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'data-sources', 'raw', 'wikipedia', 'club-categories.json')
const UA = '930-dataset-builder/1.0 (https://github.com/calotwm/930)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// dataset club name → category page (without the "Categoría:" prefix)
export const CLUB_CATEGORIES = {
  'River Plate': 'Futbolistas del Club Atlético River Plate',
  'Boca Juniors': 'Futbolistas del Club Atlético Boca Juniors',
  'Racing Club': 'Futbolistas del Racing Club',
  Independiente: 'Futbolistas del Club Atlético Independiente',
  'San Lorenzo': 'Futbolistas del Club Atlético San Lorenzo de Almagro',
  'Huracán': 'Futbolistas del Club Atlético Huracán',
  'Estudiantes LP': 'Futbolistas del Club Estudiantes de La Plata',
  'Gimnasia LP': 'Futbolistas del Club de Gimnasia y Esgrima La Plata',
  'Vélez Sarsfield': 'Futbolistas del Club Atlético Vélez Sarsfield',
  "Newell's Old Boys": "Futbolistas del Club Atlético Newell's Old Boys",
  'Rosario Central': 'Futbolistas del Club Atlético Rosario Central',
  'Argentinos Juniors': 'Futbolistas de la Asociación Atlética Argentinos Juniors',
  'Ferro Carril Oeste': 'Futbolistas del Club Ferro Carril Oeste',
  'Colón': 'Futbolistas del Club Atlético Colón',
  Tigre: 'Futbolistas del Club Atlético Tigre',
  Banfield: 'Futbolistas del Club Atlético Banfield',
  Talleres: 'Futbolistas del Club Atlético Talleres (Córdoba)',
  Quilmes: 'Futbolistas del Quilmes Atlético Club',
  'Lanús': 'Futbolistas del Club Atlético Lanús',
  Olimpo: 'Futbolistas del Club Olimpo',
  'Independiente Rivadavia': 'Futbolistas del Club Sportivo Independiente Rivadavia',
  'Instituto ACC': 'Futbolistas del Instituto Atlético Central Córdoba',
  Atlanta: 'Futbolistas del Club Atlético Atlanta',
  'Unión (Santa Fe)': 'Futbolistas del Club Atlético Unión (Santa Fe)',
  Platense: 'Futbolistas del Club Atlético Platense',
  'Chacarita Juniors': 'Futbolistas del Club Atlético Chacarita Juniors',
  Belgrano: 'Futbolistas del Club Atlético Belgrano',
  'Atlético Tucumán': 'Futbolistas del Club Atlético Tucumán',
  'Godoy Cruz': 'Futbolistas del Club Deportivo Godoy Cruz Antonio Tomba',
  'Defensa y Justicia': 'Futbolistas del Club Social y Deportivo Defensa y Justicia',
  'Arsenal de Sarandí': 'Futbolistas del Arsenal Fútbol Club',
  'Nueva Chicago': 'Futbolistas del Club Atlético Nueva Chicago',
  'All Boys': 'Futbolistas del Club Atlético All Boys',
  Temperley: 'Futbolistas del Club Atlético Temperley',
  Almagro: 'Futbolistas del Club Almagro',
  'Estudiantes (Buenos Aires)': 'Futbolistas del Club Atlético Estudiantes',
}

// big clubs split their category by decade ("… en los años 1990"): walk subcategories too,
// skipping women's teams and youth ranks
const SKIP_SUB = /femenin|inferiores|entrenador|dirigente|presidente/i

async function members(cat, depth = 0) {
  const titles = []
  let cont = ''
  for (;;) {
    const url = `https://es.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent('Categoría:' + cat)}&cmlimit=500&cmnamespace=0|14&format=json${cont}`
    let json = null
    for (let wait = 2000; wait < 130000; wait *= 2) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA } })
        if (res.ok) {
          json = await res.json()
          break
        }
      } catch {
        // dropped connection: retry
      }
      await sleep(wait)
    }
    if (!json) return null
    for (const m of json.query.categorymembers) {
      if (m.ns === 0) titles.push(m.title)
      else if (depth < 2 && !SKIP_SUB.test(m.title)) {
        await sleep(800)
        const sub = await members(m.title.replace(/^Categoría:/, ''), depth + 1)
        if (sub) titles.push(...sub)
      }
    }
    if (!json.continue) return [...new Set(titles)]
    cont = `&cmcontinue=${encodeURIComponent(json.continue.cmcontinue)}`
    await sleep(1000)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}
  for (const [club, cat] of Object.entries(CLUB_CATEGORIES)) {
    if (out[club]?.length > 5) continue
    const t = await members(cat)
    out[club] = t ?? []
    console.log(`${club}: ${t ? t.length : 'error'}`)
    fs.writeFileSync(OUT, JSON.stringify(out) + '\n')
    await sleep(1500)
  }
}
