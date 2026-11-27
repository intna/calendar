import { cn } from '@/lib/cn'

type Tone = 'yellow' | 'ivory' | 'muted'

export type StatItem = {
  label: string
  value: string
  unit?: string
  hint: string
  tone: Tone
}

const toneClass: Record<Tone, string> = {
  yellow: 'text-hive-gold',
  ivory: 'text-hive-ivory',
  muted: 'text-hive-muted',
}

export function StatBar({ items }: { items: StatItem[] }) {
  return (
    <section className="grid grid-cols-2 gap-px border border-hive-line bg-hive-line lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white px-4 py-4 sm:px-5">
          <div className="text-[11px] tracking-[0.18em] text-hive-muted">{item.label}</div>
          <div className={cn('num mt-3 text-[28px] leading-none sm:text-4xl', toneClass[item.tone])}>
            {item.value}
            {item.unit ? (
              <span className="ml-1.5 font-sans text-[11px] tracking-[0.16em] text-hive-muted">{item.unit}</span>
            ) : null}
          </div>
          <div className="mt-2 text-xs text-hive-muted">{item.hint}</div>
        </div>
      ))}
    </section>
  )
}
