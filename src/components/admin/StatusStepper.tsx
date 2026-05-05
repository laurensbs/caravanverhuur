'use client';

// Visuele state-machine indicator voor admin-pages.
// Toont een rij bolletjes met de huidige status duidelijk gemarkeerd
// + optionele "next action"-tekst eronder.
//
// Gebruik:
//   <StatusStepper
//     steps={['NIEUW', 'BEVESTIGD', 'AANBETAALD', 'VOLLEDIG_BETAALD']}
//     current="AANBETAALD"
//     labels={{ NIEUW: 'Nieuw', BEVESTIGD: 'Bevestigd', ... }}
//     nextAction="Wacht op rest-betaling klant"
//   />

import { Check } from 'lucide-react';

interface Props {
  steps: readonly string[];
  current: string;
  labels?: Record<string, string>;
  /** Optionele hint onder de stepper: "next action: stuur klant-mail". */
  nextAction?: string | null;
  /** Toon stepper op compacte hoogte (label kleiner, geen gap-tekst). */
  compact?: boolean;
}

export default function StatusStepper({ steps, current, labels = {}, nextAction, compact = false }: Props) {
  const currentIdx = steps.indexOf(current);
  // Onbekende status (bv. GEANNULEERD valt buiten de happy-path) — toon
  // alle stappen als inactief en vermeld de status apart.
  const isUnknown = currentIdx === -1;

  return (
    <div className="w-full">
      <ol className="flex items-center w-full" role="list">
        {steps.map((step, idx) => {
          const done = !isUnknown && idx < currentIdx;
          const active = !isUnknown && idx === currentIdx;
          const labelText = labels[step] || step.replace(/_/g, ' ').toLowerCase();
          return (
            <li
              key={step}
              className={`flex items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}
              aria-current={active ? 'step' : undefined}
            >
              <div className="flex flex-col items-center min-w-[44px]">
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 transition-colors ${
                    done
                      ? 'bg-green-500 text-white'
                      : active
                        ? 'bg-primary text-white ring-2 ring-primary/30'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {done ? <Check size={12} /> : idx + 1}
                </div>
                {!compact && (
                  <span
                    className={`text-[9px] sm:text-[10px] mt-1 text-center leading-tight max-w-[70px] sm:max-w-[90px] ${
                      done || active ? 'text-foreground font-medium' : 'text-muted'
                    }`}
                  >
                    {labelText}
                  </span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 ${compact ? '-mt-0' : '-mt-4'} ${
                    done ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
      {isUnknown && (
        <p className="mt-2 text-[11px] text-muted">
          Status: <span className="font-semibold text-foreground">{labels[current] || current}</span>
        </p>
      )}
      {nextAction && !isUnknown && (
        <p className="mt-2 text-[11px] text-muted">
          <span className="font-semibold text-foreground">Volgende actie:</span> {nextAction}
        </p>
      )}
    </div>
  );
}
