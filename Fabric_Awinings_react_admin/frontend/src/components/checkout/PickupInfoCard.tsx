import { useState } from 'react'
import type { CheckoutPublicConfig } from '../../types/checkoutPublic'
import { PickupMapModal } from './PickupMapModal'

type Pickup = CheckoutPublicConfig['pickup']

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10z"
      />
      <circle cx="12" cy="11" r="2.25" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v6l3 2" />
    </svg>
  )
}

function MapArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5h10v10M5 19L19 5" />
    </svg>
  )
}

/** Карточка пункта самовывоза: адрес, режим, комментарий, карта в модальном окне. */
export function PickupInfoCard({ pickup, variant = 'default' }: { pickup: Pickup; variant?: 'default' | 'compact' }) {
  const [mapOpen, setMapOpen] = useState(false)
  const title = pickup.title?.trim()
  const address = pickup.address?.trim()
  const hours = pickup.hours?.trim()
  const note = pickup.note?.trim()
  const hasCoords = pickup.lat != null && pickup.lng != null && Number.isFinite(pickup.lat) && Number.isFinite(pickup.lng)

  const canShowMap = hasCoords || Boolean(address)

  const isCompact = variant === 'compact'

  if (!title && !address && !hours && !note) {
    return (
      <div className="rounded-xl border border-dashed border-border-light bg-bg-base p-4 font-body text-sm text-text-muted">
        Адрес самовывоза уточните у менеджера после оформления заказа.
      </div>
    )
  }

  return (
    <>
    <div
      className={
        isCompact
          ? 'rounded-xl border border-border-light bg-surface/80 p-4'
          : 'rounded-2xl border border-border-light bg-gradient-to-br from-surface to-bg-base p-5 shadow-sm ring-1 ring-border-light/60'
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {title ? (
            <h3 className={`font-heading font-semibold text-text ${isCompact ? 'text-base' : 'text-lg'}`}>{title}</h3>
          ) : null}
        </div>
        {canShowMap ? (
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 font-body text-xs font-medium text-accent transition hover:bg-accent/15"
          >
            <MapArrowIcon className="h-3.5 w-3.5" />
            На карте
          </button>
        ) : null}
      </div>

      {address ? (
        <div className={`mt-4 flex gap-3 ${isCompact ? 'mt-3' : ''}`}>
          <PinIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wide text-text-muted">Адрес склада</p>
            <p className="mt-1 font-body text-sm leading-relaxed text-text">{address}</p>
          </div>
        </div>
      ) : null}

      {hours ? (
        <div className={`flex gap-3 ${address ? 'mt-4' : 'mt-4'}`}>
          <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-body text-xs font-medium uppercase tracking-wide text-text-muted">Режим работы выдачи</p>
            <p className="mt-1 font-body text-sm text-text">{hours}</p>
          </div>
        </div>
      ) : null}

      {note ? (
        <div
          className={`rounded-xl border border-border-light/80 bg-bg-base/90 p-3 font-body text-sm leading-relaxed text-text-muted ${
            hours || address ? 'mt-4' : 'mt-4'
          }`}
        >
          <span className="font-medium text-text/90">Как добраться: </span>
          {note}
        </div>
      ) : null}
    </div>
    <PickupMapModal
      open={mapOpen}
      onClose={() => setMapOpen(false)}
      title={title || 'Пункт выдачи'}
      address={address || ''}
      lat={hasCoords ? Number(pickup.lat) : null}
      lng={hasCoords ? Number(pickup.lng) : null}
    />
    </>
  )
}
