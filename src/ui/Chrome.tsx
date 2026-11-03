import { useEffect, useRef, useState } from 'react'
import { useFeedback } from './feedback'
import { Icon, type IconName } from './Icon'
import { useCountUp, usePrevious } from './useCountUp'

export type View = 'room' | 'tasks' | 'shop' | 'collection'

export const NAV_ITEMS: { id: View; label: string; icon: IconName }[] = [
  { id: 'room', label: 'Spielzimmer', icon: 'nest' },
  { id: 'tasks', label: 'Aufgaben', icon: 'tasks' },
  { id: 'shop', label: 'Shop', icon: 'shop' },
  { id: 'collection', label: 'Sammlung', icon: 'collection' },
]

export interface NavBadge { count?: number; tone?: 'gold' | 'amber'; label: string }

export function ProfileBadge({ index, size = 'md' }: { index: number; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`profile-badge profile-badge-${index === 0 ? 'sun' : 'moon'} profile-badge-${size}`} aria-hidden="true">
      <Icon name={index === 0 ? 'star' : 'moon'} filled size={size === 'lg' ? 40 : size === 'md' ? 20 : 16} />
    </span>
  )
}

interface TopBarProps {
  profileName: string
  profileIndex: number
  coins: number
  disabled: boolean
  onSwitchProfile: () => void
  onOpenShop: () => void
}

export function TopBar({ profileName, profileIndex, coins, disabled, onSwitchProfile, onOpenShop }: TopBarProps) {
  const { registerStarTarget, starLandings } = useFeedback()
  const counter = useRef<HTMLButtonElement>(null)
  const shown = useCountUp(coins, { duration: 900 })
  const previous = usePrevious(coins)
  const [pulse, setPulse] = useState<'gain' | 'spend' | null>(null)

  useEffect(() => {
    registerStarTarget(counter.current)
    return () => registerStarTarget(null)
  }, [registerStarTarget])

  useEffect(() => {
    if (previous === undefined || previous === coins) return
    setPulse(coins > previous ? 'gain' : 'spend')
    const timer = window.setTimeout(() => setPulse(null), 700)
    return () => window.clearTimeout(timer)
  }, [coins, previous])

  useEffect(() => {
    if (!starLandings) return
    const element = counter.current
    element?.classList.remove('is-landing')
    void element?.offsetWidth
    element?.classList.add('is-landing')
  }, [starLandings])

  return (
    <header className="topbar">
      <button className="profile-chip" disabled={disabled} onClick={onSwitchProfile} aria-label={`Profil ${profileName}. Profil wechseln`}>
        <ProfileBadge index={profileIndex} size="sm" />
        <span className="profile-chip-name">{profileName}</span>
        <Icon name="swap" size={16} className="profile-chip-swap" />
      </button>
      <span className="wordmark" aria-hidden="true">Fabelnest</span>
      <button ref={counter} className={`star-counter${pulse ? ` is-${pulse}` : ''}`} onClick={onOpenShop}
        aria-label={`${coins} Sterne. Zum Shop`}>
        <Icon name="star" filled size={22} className="star-counter-icon" />
        <span className="star-counter-value" aria-live="polite">{shown}</span>
      </button>
    </header>
  )
}

interface TabBarProps {
  view: View
  badges: Partial<Record<View, NavBadge>>
  onNavigate: (view: View) => void
}

export function TabBar({ view, badges, onNavigate }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {NAV_ITEMS.map((item) => {
        const badge = badges[item.id]
        const active = view === item.id
        return (
          <button key={item.id} className={`tab${active ? ' is-active' : ''}`} onClick={() => onNavigate(item.id)}
            aria-current={active ? 'page' : undefined}>
            <span className="tab-icon">
              <Icon name={item.icon} size={26} />
              {badge && (
                <span key={`${badge.count ?? 0}-${badge.tone}`} className={`tab-badge tab-badge-${badge.tone ?? 'gold'}`}>
                  {badge.count ?? ''}
                </span>
              )}
            </span>
            <span className="tab-label">{item.label}</span>
            {badge && <span className="sr-only">, {badge.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
