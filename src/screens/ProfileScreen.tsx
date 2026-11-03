import { useState } from 'react'
import { ProfileBadge } from '../ui/Chrome'
import { Icon } from '../ui/Icon'
import type { PlayerProfile, ProfileId } from '../models'

export function Splash({ text }: { text: string }) {
  return (
    <main className="splash" aria-live="polite">
      <div className="splash-mark" aria-hidden="true">
        <Icon name="moon" filled size={56} />
        <span className="splash-star splash-star-1"><Icon name="star" filled size={16} /></span>
        <span className="splash-star splash-star-2"><Icon name="star" filled size={12} /></span>
      </div>
      <p>{text}</p>
    </main>
  )
}

interface ProfileScreenProps {
  profiles: PlayerProfile[]
  error: string
  onSelect: (id: ProfileId) => void
}

export function ProfileScreen({ profiles, error, onSelect }: ProfileScreenProps) {
  const [chosen, setChosen] = useState<ProfileId | null>(null)

  function choose(id: ProfileId) {
    if (chosen) return
    setChosen(id)
    // Kurzer Moment für die Auswahl-Animation, dann öffnet sich das Nest.
    window.setTimeout(() => onSelect(id), 320)
  }

  return (
    <main className="profile-screen">
      <div className="profile-hero">
        <div className="logo-mark" aria-hidden="true">
          <Icon name="moon" filled size={44} />
          <span className="logo-twinkle"><Icon name="sparkle" filled size={18} /></span>
        </div>
        <h1 className="logo-word">Fabelnest</h1>
        <p className="profile-question">Wer spielt heute?</p>
      </div>
      {error && <p className="banner banner-error" role="alert">{error}</p>}
      <div className="profile-options" role="group" aria-label="Profil auswählen">
        {profiles.map((profile, index) => (
          <button key={profile.id} className={`profile-card${chosen === profile.id ? ' is-chosen' : ''}${chosen && chosen !== profile.id ? ' is-dimmed' : ''}`}
            onClick={() => choose(profile.id)} style={{ animationDelay: `${120 + index * 90}ms` }}>
            <ProfileBadge index={index} size="lg" />
            <span className="profile-card-name">{profile.name}</span>
            <span className="profile-card-hint">Eigenes Nest</span>
          </button>
        ))}
      </div>
      <p className="privacy-note"><Icon name="lock" size={16} /> Dein Spielstand bleibt auf diesem Gerät.</p>
    </main>
  )
}
