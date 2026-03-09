# Caravanverhuur Spanje

Volledig uitgeruste caravans huren op de mooiste campings van de Costa Brava. Een Next.js-applicatie met boekingssysteem, betalingen via Stripe (iDEAL), meertalige ondersteuning (NL/EN/ES) en admin-panel.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Taal:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion
- **Database:** SQLite
- **Betalingen:** Stripe (iDEAL)
- **Hosting:** Vercel

## Aan de slag

```bash
# Installeer dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

## Omgevingsvariabelen

Maak een `.env.local` bestand aan met:

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Admin
ADMIN_PASSWORD=...
STAFF_PASSWORD=...
ADMIN_SECRET=...

# E-mail
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=...

# Newsletter
NEWSLETTER_SECRET=...

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Projectstructuur

```
src/
├── app/           # Next.js App Router pagina's + API routes
├── components/    # Herbruikbare UI-componenten
├── data/          # Statische data (caravans, campings, bestemmingen)
├── i18n/          # Vertalingen (NL/EN/ES)
└── lib/           # Utilities (db, email, auth, rate-limit, stripe)
```

## Belangrijke features

- **Boekingssysteem:** Stapsgewijs boeken met datumkeuze, camping, caravan en persoonlijke gegevens
- **Chatbot:** Interactieve chatbot met inline boekingsflow
- **Admin panel:** Beheer van boekingen, klanten, caravans, campings, kortingscodes en nieuwsbrieven
- **Meertalig:** Nederlands, Engels en Spaans
- **Betalingen:** Aanbetaling + restbetaling via Stripe iDEAL
- **Borgbeheer:** Digitale inspectie met foto-upload
