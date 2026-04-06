// ===== EMAIL TRANSLATIONS =====
// Multilingual email content: NL (Dutch), EN (English), ES (Spanish)

export type EmailLocale = 'nl' | 'en' | 'es';

interface EmailTranslations {
  // Shared
  lang: string;
  footerTagline: string;
  footerContact: string;
  footerPrivacy: string;
  footerTerms: string;
  footerCopyright: string;
  spamNotice: string;

  // Date formatting
  dateLocale: string;

  // Welcome
  welcomeBadge: string;
  welcomeSubject: (name: string) => string;
  welcomeHeading: (name: string) => string;
  welcomeSubtext: string;
  welcomeCard1: string;
  welcomeCard2: string;
  welcomeCard3: string;
  welcomeTip: string;
  welcomeButton: string;
  welcomePreheader: string;

  // Booking confirmation
  bookingBadge: string;
  bookingSubject: (ref: string) => string;
  bookingHeading: string;
  bookingSubtext: (name: string) => string;
  bookingRefLabel: string;
  bookingAwaitConfirm: string;
  bookingAwaitPaymentLink: string;
  bookingCaravan: string;
  bookingCamping: string;
  bookingSpot: string;
  bookingCheckIn: string;
  bookingCheckOut: string;
  bookingNights: string;
  bookingGuests: string;
  bookingAdults: string;
  bookingChildren: string;
  bookingTotalPrice: string;
  bookingPayBefore: string;
  bookingRestOnCamping: string;
  bookingBorgOnCamping: string;
  bookingDirectPayment: string;
  bookingImmediateNote: (price: string, deadline: string) => string;
  bookingPendingPaymentNote: (price: string, deadline: string) => string;
  bookingLaterNote: (price: string, deadline: string) => string;
  bookingPayNow: (amount: string) => string;
  bookingButton: string;
  bookingBeddingReminder: string;
  // Payment link email
  paymentLinkSubject: (ref: string) => string;
  paymentLinkHeading: string;
  paymentLinkText: (name: string, ref: string, amount: string) => string;
  paymentLinkButton: (amount: string) => string;
  countdownBeddingReminder: string;

  // Manual booking (phone)
  manualBadge: string;
  manualSubject: (ref: string) => string;
  manualHeading: string;
  manualSubtext: (name: string) => string;
  manualConfirmed: string;
  manualPayNote: string;
  manualPayButton: (price: string) => string;
  manualPayLater: string;
  manualAccountTitle: string;
  manualAccountDesc: string;
  manualEmail: string;
  manualPassword: string;
  manualChangePassword: string;
  manualLoginButton: string;

  // Payment confirmation
  paymentBadge: string;
  paymentSubject: (ref: string) => string;
  paymentHeading: string;
  paymentSubtext: (name: string) => string;
  paymentTypeRental: string;
  paymentTypeDeposit: string;
  paymentTypeRemaining: string;
  paymentTypeBorg: string;
  paymentPaidOn: (date: string) => string;
  paymentRef: string;
  paymentType: string;
  paymentAmount: string;
  paymentButton: string;
  paymentBookingOverview: string;
  paymentTotalPrice: string;
  paymentDepositPaid: string;
  paymentRestOnCamping: string;
  paymentBorgOnCamping: string;

  // Contact acknowledgment
  contactBadge: string;
  contactSubject: string;
  contactHeading: string;
  contactSubtext: (name: string, subject: string) => string;
  contactResponseTime: string;
  contactButton: string;

  // Contact reply
  replyBadge: string;
  replySubject: (subject: string) => string;
  replyHeading: (name: string) => string;
  replySubtext: (subject: string) => string;
  replyLabel: string;
  replyFollowUp: string;
  replyButton: string;

  // Borg checklist
  borgBadge: string;
  borgSubject: (ref: string) => string;
  borgHeading: string;
  borgSubtext: (name: string, typeLabel: string) => string;
  borgBooking: string;
  borgCheckInType: string;
  borgCheckOutType: string;
  borgNote: string;
  borgButton: string;
  borgDashboardLink: string;
  borgConfirmSubject: (ref: string) => string;
  borgConfirmHeading: string;
  borgConfirmSubtext: (name: string) => string;
  borgReturnMethodLabel: string;
  borgReturnCash: string;
  borgReturnBank: string;
  borgRefundAmount: string;
  borgConfirmNote: string;
  borgConfirmDashboardLink: string;

  // Delete confirmation
  deleteBadge: string;
  deleteSubject: string;
  deleteHeading: string;
  deleteSubtext: (name: string) => string;
  deleteWarning: string;
  deleteInstruction: string;
  deleteButton: string;
  deleteIgnore: string;

  // Countdown
  countdownBadge: string;
  countdownHi: (name: string) => string;
  countdownWeeks: string;
  countdownDays: string;
  countdownTip: string;
  countdown30Subject: string;
  countdown30Text: string;
  countdown14Subject: string;
  countdown14Text: string;
  countdown7Subject: string;
  countdown7Text: string;
  countdown3Subject: string;
  countdown3Text: string;
  countdown1Subject: string;
  countdown1Text: string;
  countdownDefaultSubject: (days: number) => string;
  countdownDefaultText: (days: number) => string;
  countdownButton: string;

  // Password reset
  resetBadge: string;
  resetSubject: string;
  resetHeading: (name: string) => string;
  resetSubtext: string;
  resetButton: string;
  resetExpiry: string;

  // Email verification
  verifyBadge: string;
  verifySubject: string;
  verifyHeading: string;
  verifySubtext: (name: string) => string;
  verifyButton: string;
  verifyExpiry: string;

  // Payment reminder
  reminderBadge: string;
  reminderUrgentSubject: (days: number, ref: string) => string;
  reminderNormalSubject: (ref: string) => string;
  reminderUrgentHeading: string;
  reminderNormalHeading: string;
  reminderSubtext: (name: string, days: number) => string;
  reminderToPay: string;
  reminderForBooking: (ref: string) => string;
  reminderRef: string;
  reminderArrival: string;
  reminderOutstanding: string;
  reminderPayNote: string;
  reminderUrgentNote: string;
  reminderButton: string;

  // Cancellation
  cancelBadge: string;
  cancelSubject: (ref: string) => string;
  cancelHeading: string;
  cancelSubtext: (name: string) => string;
  cancelRef: string;
  cancelRefundLabel: (pct: number) => string;
  cancelRefundNote: string;
  cancelButton: string;

  // Review request
  reviewBadge: string;
  reviewSubject: (name: string) => string;
  reviewHeading: (name: string) => string;
  reviewSubtext: string;
  reviewDateRange: (from: string, to: string) => string;
  reviewRateQuestion: string;
  reviewButton: string;
  reviewThanks: string;
  reviewFeedbackTitle: string;
  reviewFeedbackButton: string;
}

const nl: EmailTranslations = {
  lang: 'nl',
  footerTagline: 'Caravans aan de Costa Brava',
  footerContact: 'Contact',
  footerPrivacy: 'Privacy',
  footerTerms: 'Voorwaarden',
  footerCopyright: 'Alle rechten voorbehouden.',
  spamNotice: '📬 Geen e-mail ontvangen? Controleer je spam- of ongewenste-e-mailmap en voeg <strong>info@caravanverhuurspanje.com</strong> toe aan je contacten.',
  dateLocale: 'nl-NL',

  // Welcome
  welcomeBadge: 'WELKOM',
  welcomeSubject: (name) => `Welkom bij Caravanverhuur Spanje, ${name}! ☀️`,
  welcomeHeading: (name) => `Hallo ${name}!`,
  welcomeSubtext: 'Wat leuk dat je een account hebt aangemaakt! Je bent nu helemaal klaar om jouw droomvakantie aan de Costa Brava te boeken.',
  welcomeCard1: 'Caravans bekijken &amp; boeken',
  welcomeCard2: 'Boekingen &amp; betalingen',
  welcomeCard3: 'Borg-checklist tekenen',
  welcomeTip: '<strong>🌴 Wist je dat?</strong> Al onze caravans staan op toplocaties aan de Spaanse Costa Brava, met directe toegang tot stranden, restaurants en lokale markten.',
  welcomeButton: 'Bekijk onze caravans →',
  welcomePreheader: 'Welkom bij Caravanverhuur Spanje — je account is klaar!',

  // Booking
  bookingBadge: 'NIEUWE BOEKING',
  bookingSubject: (ref) => `Boeking ${ref} bevestigd ✅`,
  bookingHeading: 'Boeking ontvangen',
  bookingSubtext: (name) => `Bedankt ${name}! Betaal de aanbetaling (25%) om je boeking definitief te maken.`,
  bookingRefLabel: 'Referentienummer',
  bookingAwaitConfirm: '💳 Betaal om te bevestigen',
  bookingAwaitPaymentLink: '⏳ Betaallink volgt per e-mail',
  bookingCaravan: 'Caravan',
  bookingCamping: 'Camping',
  bookingSpot: 'Plek',
  bookingCheckIn: 'Inchecken',
  bookingCheckOut: 'Uitchecken',
  bookingNights: 'Nachten',
  bookingGuests: 'Gasten',
  bookingAdults: 'volw.',
  bookingChildren: 'kind.',
  bookingTotalPrice: 'Totaalprijs',
  bookingPayBefore: '💳 Aanbetaling (25%)',
  bookingRestOnCamping: '💰 Restbetaling (75%) — op de camping (contant of pin)',
  bookingBorgOnCamping: '🔒 Borg — op de camping (contant of pin)',
  bookingDirectPayment: 'Direct bij boeking',
  bookingImmediateNote: (price, _) => `<strong>Betalingsoverzicht:</strong> De aanbetaling van 25% dient nu voldaan te worden via iDEAL/Wero in je account. Het restbedrag en de borg betaal je op de camping (contant of pin).`,
  bookingPendingPaymentNote: (price, _) => `<strong>Betalingsoverzicht:</strong> Je ontvangt binnenkort een betaallink per e-mail om de aanbetaling van 25% te voldoen via iDEAL/Wero. Het restbedrag en de borg betaal je op de camping (contant of pin).`,
  bookingLaterNote: (price, deadline) => `<strong>Betalingsoverzicht:</strong> Betaal de aanbetaling van 25% vóór ${deadline} via iDEAL/Wero in je account. Het restbedrag en de borg betaal je op de camping (contant of pin).`,
  bookingPayNow: (amount: string) => `Betaal aanbetaling ${amount} →`,
  bookingButton: 'Ga naar mijn account →',
  bookingBeddingReminder: '🛏️ <strong>LET OP:</strong> Je hebt geen beddengoed bijgeboekt. Vergeet niet om zelf dekbedden, kussens en hoeslakens mee te nemen! Alsnog bijboeken? Neem contact met ons op.',
  // Payment link email
  paymentLinkSubject: (ref) => `Betaallink voor boeking ${ref} 💳`,
  paymentLinkHeading: 'Betaallink beschikbaar',
  paymentLinkText: (name, ref, amount) => `Hoi ${name}! De betaallink voor je boeking <strong>${ref}</strong> is nu beschikbaar. Betaal de aanbetaling van <strong>${amount}</strong> via de knop hieronder.`,
  paymentLinkButton: (amount) => `Betaal ${amount} aanbetaling →`,
  countdownBeddingReminder: '🛏️ <strong>Beddengoed:</strong> Je hebt geen beddengoed bijgeboekt. Vergeet niet om zelf dekbedden, kussens en hoeslakens mee te nemen!',

  // Manual booking
  manualBadge: 'TELEFONISCHE BOEKING',
  manualSubject: (ref) => `Boeking ${ref} — betaallink & gegevens`,
  manualHeading: 'Je boeking is aangemaakt',
  manualSubtext: (name) => `Hoi ${name}! Naar aanleiding van ons telefoongesprek hebben wij een boeking voor je aangemaakt. Hieronder vind je alle gegevens en de betaallink.`,
  manualConfirmed: '✅ Bevestigd',
  manualPayNote: '<strong>Betaal de aanbetaling (25%) via de knop hieronder.</strong> Je wordt doorgestuurd naar een beveiligde iDEAL/Wero betaalpagina. Het restbedrag en de borg betaal je op de camping (contant of pin).',
  manualPayButton: (price) => `Betaal ${price} aanbetaling via iDEAL →`,
  manualPayLater: 'Of betaal later via je persoonlijke dashboard',
  manualAccountTitle: '🔐 Jouw account',
  manualAccountDesc: 'Er is automatisch een account voor je aangemaakt zodat je je boeking kunt beheren, betalingen kunt doen en je borg kunt inzien.',
  manualEmail: 'E-mail',
  manualPassword: 'Wachtwoord',
  manualChangePassword: 'Je kunt je wachtwoord wijzigen na het inloggen.',
  manualLoginButton: 'Inloggen op je account →',

  // Payment
  paymentBadge: 'BETALING ONTVANGEN',
  paymentSubject: (ref) => `Betaling ontvangen — ${ref}`,
  paymentHeading: 'Betaling geslaagd!',
  paymentSubtext: (name) => `Bedankt ${name}, je betaling is in goede orde ontvangen en verwerkt.`,
  paymentTypeRental: 'Huurbedrag',
  paymentTypeDeposit: 'Aanbetaling',
  paymentTypeRemaining: 'Restbetaling',
  paymentTypeBorg: 'Borg',
  paymentPaidOn: (date) => `✓ Betaald op ${date}`,
  paymentRef: 'Referentie',
  paymentType: 'Type',
  paymentAmount: 'Bedrag',
  paymentButton: 'Bekijk mijn account →',
  paymentBookingOverview: 'Overzicht boeking',
  paymentTotalPrice: 'Totale huurprijs',
  paymentDepositPaid: 'Aanbetaling voldaan',
  paymentRestOnCamping: 'Restbetaling — op de camping (contant of pin)',
  paymentBorgOnCamping: 'Borg — op de camping (contant of pin)',

  // Contact
  contactBadge: 'BERICHT ONTVANGEN',
  contactSubject: 'We hebben je bericht ontvangen',
  contactHeading: 'Bedankt voor je bericht!',
  contactSubtext: (name, subject) => `Hallo ${name}, we hebben je bericht over "<em>${subject}</em>" ontvangen en nemen zo snel mogelijk contact met je op.`,
  contactResponseTime: '<strong>Reactietijd:</strong> We reageren meestal binnen 24 uur. Bij dringende vragen kun je ons ook bereiken via WhatsApp of telefoon.',
  contactButton: 'Bekijk onze contactgegevens →',

  // Reply
  replyBadge: 'REACTIE OP JE BERICHT',
  replySubject: (subject) => `Reactie op je bericht: ${subject}`,
  replyHeading: (name) => `Hallo ${name}!`,
  replySubtext: (subject) => `We hebben gereageerd op je bericht over "<em>${subject}</em>".`,
  replyLabel: 'Ons antwoord:',
  replyFollowUp: 'Heb je nog verdere vragen? Reageer gerust op deze e-mail of neem contact met ons op via onze website.',
  replyButton: 'Neem contact op →',

  // Borg
  borgBadge: 'INSPECTIE',
  borgSubject: (ref) => `Borgchecklist klaar — ${ref}`,
  borgHeading: 'Inspectie afgerond',
  borgSubtext: (name, typeLabel) => `Hallo ${name}, de ${typeLabel}-inspectie voor je boeking is afgerond. Bekijk de resultaten en geef je akkoord.`,
  borgBooking: 'Boeking',
  borgCheckInType: '📥 Incheck-inspectie',
  borgCheckOutType: '📤 Uitcheck-inspectie',
  borgNote: 'Bekijk de checklist en geef je akkoord of dien eventueel bezwaar in. Dit kan via onderstaande link of via je account.',
  borgButton: 'Bekijk checklist & reageer →',
  borgDashboardLink: 'Of bekijk via je account →',
  borgConfirmSubject: (ref) => `Borg bevestiging — ${ref}`,
  borgConfirmHeading: 'Borg-inspectie akkoord',
  borgConfirmSubtext: (name) => `Hallo ${name}, bedankt voor je akkoord op de borg-inspectie. Hieronder vind je een overzicht van de terugbetaling.`,
  borgReturnMethodLabel: 'Terugbetaling via',
  borgReturnCash: '💵 Contant (op de camping)',
  borgReturnBank: '🏦 Bankovermaking (1-5 werkdagen)',
  borgRefundAmount: 'Terug te ontvangen',
  borgConfirmNote: 'Je borg wordt terugbetaald volgens de gekozen methode. Bij bankoverschrijving kan het 1-5 werkdagen duren.',
  borgConfirmDashboardLink: 'Bekijk status in je account →',

  // Delete
  deleteBadge: 'ACCOUNT VERWIJDEREN',
  deleteSubject: 'Bevestig verwijdering van je account',
  deleteHeading: 'Account verwijderen',
  deleteSubtext: (name) => `Hallo ${name}, we hebben een verzoek ontvangen om je account te verwijderen.`,
  deleteWarning: '<strong>Dit is onomkeerbaar.</strong> Alle gegevens, boekingen en betalingshistorie worden permanent verwijderd.',
  deleteInstruction: 'Klik op de onderstaande knop om de verwijdering te bevestigen. Deze link is <strong>24 uur</strong> geldig.',
  deleteButton: 'Ja, verwijder mijn account →',
  deleteIgnore: 'Heb je dit verzoek niet gedaan? Negeer deze e-mail — er wordt niets verwijderd.',

  // Countdown
  countdownBadge: 'COUNTDOWN',
  countdownHi: (name) => `Hallo ${name}, je vakantie komt in zicht!`,
  countdownWeeks: 'weken',
  countdownDays: 'dagen',
  countdownTip: '<strong>Tip:</strong> Bewaar onze contactgegevens voor je reis. Bij vragen kun je ons bereiken via info@caravanverhuurspanje.com of WhatsApp.',
  countdown30Subject: 'Nog 30 dagen — je vakantie komt eraan!',
  countdown30Text: 'Over precies 30 dagen begint je vakantie aan de Costa Brava! Tijd om alvast te gaan pakken en je reisgids te bekijken.',
  countdown14Subject: 'Nog 2 weken tot de Costa Brava!',
  countdown14Text: 'De vakantie is bijna in zicht! Nog slechts twee weken en je geniet van de zon, zee en de prachtige Costa Brava.',
  countdown7Subject: 'Volgende week begint je vakantie!',
  countdown7Text: 'Nog maar één week! Heb je alles ingepakt? Vergeet je reisdocumenten niet en neem genoeg zonnebrand mee.',
  countdown3Subject: 'Over 3 dagen ben je op vakantie!',
  countdown3Text: 'Het is bijna zover! Nog drie nachtjes slapen en je bent op je vakantiebestemming. We hebben alles klaarstaan!',
  countdown1Subject: 'Morgen begint je vakantie!',
  countdown1Text: 'Morgen is het zover! We hopen dat je een fantastische reis hebt. De caravan is schoon en klaar voor je komst.',
  countdownDefaultSubject: (days) => `Nog ${days} dagen tot je vakantie!`,
  countdownDefaultText: (days) => `Je vakantie aan de Costa Brava komt steeds dichterbij. Nog ${days} dagen!`,
  countdownButton: 'Bekijk mijn boeking →',

  // Password reset
  resetBadge: 'WACHTWOORD HERSTELLEN',
  resetSubject: '🔑 Wachtwoord herstellen',
  resetHeading: (name) => `Hallo ${name}`,
  resetSubtext: 'We hebben een verzoek ontvangen om je wachtwoord te herstellen. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.',
  resetButton: 'Nieuw wachtwoord instellen →',
  resetExpiry: 'Deze link is <strong>1 uur geldig</strong>. Heb je dit verzoek niet gedaan? Dan kun je deze email veilig negeren.',

  // Verification
  verifyBadge: 'E-MAIL VERIFICATIE',
  verifySubject: '✉️ Bevestig je e-mailadres',
  verifyHeading: 'Bevestig je e-mailadres',
  verifySubtext: (name) => `Hallo ${name}, klik op de knop hieronder om je e-mailadres te bevestigen. Zo weten we zeker dat we je op het juiste adres kunnen bereiken.`,
  verifyButton: 'E-mailadres bevestigen →',
  verifyExpiry: 'Deze link is 24 uur geldig. Als je geen account hebt aangemaakt, kun je deze email negeren.',

  // Payment reminder
  reminderBadge: 'BETALINGSHERINNERING',
  reminderUrgentSubject: (days, ref) => `⚠️ Betaling vereist — nog ${days} dagen tot aankomst (${ref})`,
  reminderNormalSubject: (ref) => `Herinnering: betaling voor je vakantie (${ref})`,
  reminderUrgentHeading: 'Actie vereist!',
  reminderNormalHeading: 'Betaling openstaand',
  reminderSubtext: (name, days) => `Beste ${name}, de betaling voor je boeking is nog niet ontvangen. Je aankomst is over <strong>${days} dagen</strong>.`,
  reminderToPay: 'Nog te betalen',
  reminderForBooking: (ref) => `Betaling voor boeking ${ref}`,
  reminderRef: 'Referentie',
  reminderArrival: 'Aankomst',
  reminderOutstanding: 'Openstaand',
  reminderPayNote: '<strong>💡 Betaal eenvoudig via iDEAL/Wero</strong> vanuit je account. De betaling wordt direct verwerkt.',
  reminderUrgentNote: '<br/><br/>⚠️ <strong>Let op:</strong> zonder betaling kan je verblijf niet doorgaan.',
  reminderButton: 'Nu betalen →',

  // Cancellation
  cancelBadge: 'ANNULERING BEVESTIGD',
  cancelSubject: (ref) => `❌ Boeking geannuleerd — ${ref}`,
  cancelHeading: 'Boeking geannuleerd',
  cancelSubtext: (name) => `Hallo ${name}, je boeking is succesvol geannuleerd. Hieronder vind je de details.`,
  cancelRef: 'Referentie',
  cancelRefundLabel: (pct) => `Restitutie: ${pct}%`,
  cancelRefundNote: 'Eventuele restituties worden binnen 7 werkdagen verwerkt. Heb je vragen? Neem gerust contact op.',
  cancelButton: 'Contact opnemen →',

  // Review
  reviewBadge: 'REVIEW',
  reviewSubject: (name) => `⭐ ${name}, hoe was je vakantie? Laat een review achter!`,
  reviewHeading: (name) => `Hoe was je vakantie, ${name}?`,
  reviewSubtext: 'We hopen dat je een fantastische tijd hebt gehad aan de Costa Brava! Je mening helpt andere vakantiegangers bij hun keuze — en het kost maar 1 minuut.',
  reviewDateRange: (from, to) => `${from} t/m ${to}`,
  reviewRateQuestion: 'Hoe beoordeel jij je ervaring?',
  reviewButton: 'Laat een Google Review achter ⭐',
  reviewThanks: 'Door een review achter te laten help je ons én andere vakantiegangers. Hartelijk dank! 🙏',
  reviewFeedbackTitle: '<strong>Was er iets niet goed?</strong> Laat het ons weten zodat we het kunnen verbeteren. Je kunt ons altijd bereiken via het contactformulier.',
  reviewFeedbackButton: 'Feedback geven →',
};

const en: EmailTranslations = {
  lang: 'en',
  footerTagline: 'Caravans on the Costa Brava',
  footerContact: 'Contact',
  footerPrivacy: 'Privacy',
  footerTerms: 'Terms',
  footerCopyright: 'All rights reserved.',
  spamNotice: '📬 Didn\'t receive an email? Check your spam or junk folder and add <strong>info@caravanverhuurspanje.com</strong> to your contacts.',
  dateLocale: 'en-GB',

  // Welcome
  welcomeBadge: 'WELCOME',
  welcomeSubject: (name) => `Welcome to Caravanverhuur Spanje, ${name}! ☀️`,
  welcomeHeading: (name) => `Hello ${name}!`,
  welcomeSubtext: 'Great to have you on board! You\'re all set to book your dream holiday on the Costa Brava.',
  welcomeCard1: 'Browse &amp; book caravans',
  welcomeCard2: 'Bookings &amp; payments',
  welcomeCard3: 'Deposit checklist',
  welcomeTip: '<strong>🌴 Did you know?</strong> All our caravans are located at top spots on the Spanish Costa Brava, with direct access to beaches, restaurants and local markets.',
  welcomeButton: 'View our caravans →',
  welcomePreheader: 'Welcome to Caravanverhuur Spanje — your account is ready!',

  // Booking
  bookingBadge: 'NEW BOOKING',
  bookingSubject: (ref) => `Booking ${ref} confirmed ✅`,
  bookingHeading: 'Booking received',
  bookingSubtext: (name) => `Thank you ${name}! Pay the deposit (25%) to confirm your booking.`,
  bookingRefLabel: 'Reference number',
  bookingAwaitConfirm: '💳 Pay to confirm',
  bookingAwaitPaymentLink: '⏳ Payment link coming soon',
  bookingCaravan: 'Caravan',
  bookingCamping: 'Campsite',
  bookingSpot: 'Pitch',
  bookingCheckIn: 'Check-in',
  bookingCheckOut: 'Check-out',
  bookingNights: 'Nights',
  bookingGuests: 'Guests',
  bookingAdults: 'adults',
  bookingChildren: 'children',
  bookingTotalPrice: 'Total price',
  bookingPayBefore: '💳 Down payment (25%)',
  bookingRestOnCamping: '💰 Remaining (75%) — at the campsite (cash or card/PIN)',
  bookingBorgOnCamping: '🔒 Deposit — at the campsite (cash or card/PIN)',
  bookingDirectPayment: 'Immediately upon booking',
  bookingImmediateNote: (price, _) => `<strong>Payment overview:</strong> The 25% down payment must be paid now via iDEAL/Wero in your account. The remaining amount and deposit are paid at the campsite (cash or card/PIN).`,
  bookingPendingPaymentNote: (price, _) => `<strong>Payment overview:</strong> You will receive a payment link by email shortly to pay the 25% down payment via iDEAL/Wero. The remaining amount and deposit are paid at the campsite (cash or card/PIN).`,
  bookingLaterNote: (price, deadline) => `<strong>Payment overview:</strong> Pay the 25% down payment before ${deadline} via iDEAL/Wero in your account. The remaining amount and deposit are paid at the campsite (cash or card/PIN).`,
  bookingPayNow: (amount: string) => `Pay deposit ${amount} →`,
  bookingButton: 'Go to my account →',
  bookingBeddingReminder: '🛏️ <strong>NOTE:</strong> You have not booked bed linen. Don\'t forget to bring your own duvets, pillows and fitted sheets! Want to add bed linen? Contact us.',
  // Payment link email
  paymentLinkSubject: (ref) => `Payment link for booking ${ref} 💳`,
  paymentLinkHeading: 'Payment link available',
  paymentLinkText: (name, ref, amount) => `Hi ${name}! The payment link for your booking <strong>${ref}</strong> is now available. Pay the deposit of <strong>${amount}</strong> via the button below.`,
  paymentLinkButton: (amount) => `Pay ${amount} deposit →`,
  countdownBeddingReminder: '🛏️ <strong>Bed linen:</strong> You have not booked bed linen. Don\'t forget to bring your own duvets, pillows and fitted sheets!',

  // Manual booking
  manualBadge: 'PHONE BOOKING',
  manualSubject: (ref) => `Booking ${ref} — payment link & details`,
  manualHeading: 'Your booking has been created',
  manualSubtext: (name) => `Hi ${name}! Following our phone call, we have created a booking for you. Below you will find all the details and the payment link.`,
  manualConfirmed: '✅ Confirmed',
  manualPayNote: '<strong>Pay the down payment (25%) via the button below.</strong> You will be redirected to a secure iDEAL/Wero payment page. The remaining amount and deposit are paid at the campsite (cash or card/PIN).',
  manualPayButton: (price) => `Pay ${price} deposit via iDEAL →`,
  manualPayLater: 'Or pay later via your personal dashboard',
  manualAccountTitle: '🔐 Your account',
  manualAccountDesc: 'An account has been automatically created for you so you can manage your booking, make payments and view your deposit status.',
  manualEmail: 'Email',
  manualPassword: 'Password',
  manualChangePassword: 'You can change your password after logging in.',
  manualLoginButton: 'Log in to your account →',

  // Payment
  paymentBadge: 'PAYMENT RECEIVED',
  paymentSubject: (ref) => `Payment received — ${ref}`,
  paymentHeading: 'Payment successful!',
  paymentSubtext: (name) => `Thank you ${name}, your payment has been received and processed.`,
  paymentTypeRental: 'Rental amount',
  paymentTypeDeposit: 'Deposit payment',
  paymentTypeRemaining: 'Remaining payment',
  paymentTypeBorg: 'Security deposit',
  paymentPaidOn: (date) => `✓ Paid on ${date}`,
  paymentRef: 'Reference',
  paymentType: 'Type',
  paymentAmount: 'Amount',
  paymentButton: 'View my account →',
  paymentBookingOverview: 'Booking overview',
  paymentTotalPrice: 'Total rental price',
  paymentDepositPaid: 'Deposit paid',
  paymentRestOnCamping: 'Remaining — at the campsite (cash or card/PIN)',
  paymentBorgOnCamping: 'Deposit — at the campsite (cash or card/PIN)',

  // Contact
  contactBadge: 'MESSAGE RECEIVED',
  contactSubject: 'We have received your message',
  contactHeading: 'Thank you for your message!',
  contactSubtext: (name, subject) => `Hello ${name}, we have received your message about "<em>${subject}</em>" and will get back to you as soon as possible.`,
  contactResponseTime: '<strong>Response time:</strong> We usually respond within 24 hours. For urgent questions, you can also reach us via WhatsApp or phone.',
  contactButton: 'View our contact details →',

  // Reply
  replyBadge: 'REPLY TO YOUR MESSAGE',
  replySubject: (subject) => `Reply to your message: ${subject}`,
  replyHeading: (name) => `Hello ${name}!`,
  replySubtext: (subject) => `We have replied to your message about "<em>${subject}</em>".`,
  replyLabel: 'Our response:',
  replyFollowUp: 'Do you have further questions? Feel free to reply to this email or contact us via our website.',
  replyButton: 'Contact us →',

  // Borg
  borgBadge: 'INSPECTION',
  borgSubject: (ref) => `Deposit checklist ready — ${ref}`,
  borgHeading: 'Inspection completed',
  borgSubtext: (name, typeLabel) => `Hello ${name}, the ${typeLabel} inspection for your booking has been completed. Review the results and give your approval.`,
  borgBooking: 'Booking',
  borgCheckInType: '📥 Check-in inspection',
  borgCheckOutType: '📤 Check-out inspection',
  borgNote: 'Review the checklist and give your approval or file an objection. You can do this via the link below or via your account.',
  borgButton: 'View checklist & respond →',
  borgDashboardLink: 'Or view via your account →',
  borgConfirmSubject: (ref) => `Deposit confirmation — ${ref}`,
  borgConfirmHeading: 'Deposit inspection agreed',
  borgConfirmSubtext: (name) => `Hello ${name}, thank you for your approval of the deposit inspection. Below is an overview of your refund.`,
  borgReturnMethodLabel: 'Refund via',
  borgReturnCash: '💵 Cash (at the camping)',
  borgReturnBank: '🏦 Bank transfer (1-5 business days)',
  borgRefundAmount: 'Amount to receive',
  borgConfirmNote: 'Your deposit will be refunded according to the chosen method. Bank transfers may take 1-5 business days.',
  borgConfirmDashboardLink: 'View status in your account →',

  // Delete
  deleteBadge: 'DELETE ACCOUNT',
  deleteSubject: 'Confirm deletion of your account',
  deleteHeading: 'Delete account',
  deleteSubtext: (name) => `Hello ${name}, we have received a request to delete your account.`,
  deleteWarning: '<strong>This is irreversible.</strong> All data, bookings and payment history will be permanently deleted.',
  deleteInstruction: 'Click the button below to confirm the deletion. This link is valid for <strong>24 hours</strong>.',
  deleteButton: 'Yes, delete my account →',
  deleteIgnore: 'Did not request this? Ignore this email — nothing will be deleted.',

  // Countdown
  countdownBadge: 'COUNTDOWN',
  countdownHi: (name) => `Hello ${name}, your holiday is approaching!`,
  countdownWeeks: 'weeks',
  countdownDays: 'days',
  countdownTip: '<strong>Tip:</strong> Save our contact details for your trip. For questions you can reach us at info@caravanverhuurspanje.com or WhatsApp.',
  countdown30Subject: 'Only 30 days — your holiday is coming!',
  countdown30Text: 'In exactly 30 days your holiday on the Costa Brava begins! Time to start packing and reviewing your travel guide.',
  countdown14Subject: 'Only 2 weeks until the Costa Brava!',
  countdown14Text: 'The holiday is almost here! Just two more weeks and you\'ll be enjoying the sun, sea and the beautiful Costa Brava.',
  countdown7Subject: 'Your holiday starts next week!',
  countdown7Text: 'Only one week to go! Have you packed everything? Don\'t forget your travel documents and bring enough sunscreen.',
  countdown3Subject: 'In 3 days you\'ll be on holiday!',
  countdown3Text: 'It\'s almost time! Just three more sleeps and you\'ll be at your holiday destination. We have everything ready!',
  countdown1Subject: 'Your holiday starts tomorrow!',
  countdown1Text: 'Tomorrow is the day! We hope you have a fantastic trip. The caravan is clean and ready for your arrival.',
  countdownDefaultSubject: (days) => `${days} days until your holiday!`,
  countdownDefaultText: (days) => `Your holiday on the Costa Brava is getting closer. Only ${days} more days!`,
  countdownButton: 'View my booking →',

  // Password reset
  resetBadge: 'PASSWORD RESET',
  resetSubject: '🔑 Reset your password',
  resetHeading: (name) => `Hello ${name}`,
  resetSubtext: 'We have received a request to reset your password. Click the button below to set a new password.',
  resetButton: 'Set new password →',
  resetExpiry: 'This link is valid for <strong>1 hour</strong>. Didn\'t request this? You can safely ignore this email.',

  // Verification
  verifyBadge: 'EMAIL VERIFICATION',
  verifySubject: '✉️ Confirm your email address',
  verifyHeading: 'Confirm your email address',
  verifySubtext: (name) => `Hello ${name}, click the button below to confirm your email address. This way we can be sure we reach you at the right address.`,
  verifyButton: 'Confirm email address →',
  verifyExpiry: 'This link is valid for 24 hours. If you did not create an account, you can ignore this email.',

  // Payment reminder
  reminderBadge: 'PAYMENT REMINDER',
  reminderUrgentSubject: (days, ref) => `⚠️ Payment required — ${days} days until arrival (${ref})`,
  reminderNormalSubject: (ref) => `Reminder: payment for your holiday (${ref})`,
  reminderUrgentHeading: 'Action required!',
  reminderNormalHeading: 'Payment outstanding',
  reminderSubtext: (name, days) => `Dear ${name}, payment for your booking has not yet been received. Your arrival is in <strong>${days} days</strong>.`,
  reminderToPay: 'Amount due',
  reminderForBooking: (ref) => `Payment for booking ${ref}`,
  reminderRef: 'Reference',
  reminderArrival: 'Arrival',
  reminderOutstanding: 'Outstanding',
  reminderPayNote: '<strong>💡 Pay easily via iDEAL/Wero</strong> from your account. The payment is processed immediately.',
  reminderUrgentNote: '<br/><br/>⚠️ <strong>Please note:</strong> without payment your stay cannot proceed.',
  reminderButton: 'Pay now →',

  // Cancellation
  cancelBadge: 'CANCELLATION CONFIRMED',
  cancelSubject: (ref) => `❌ Booking cancelled — ${ref}`,
  cancelHeading: 'Booking cancelled',
  cancelSubtext: (name) => `Hello ${name}, your booking has been successfully cancelled. Below you will find the details.`,
  cancelRef: 'Reference',
  cancelRefundLabel: (pct) => `Refund: ${pct}%`,
  cancelRefundNote: 'Any refunds will be processed within 7 business days. If you have questions, please don\'t hesitate to contact us.',
  cancelButton: 'Contact us →',

  // Review
  reviewBadge: 'REVIEW',
  reviewSubject: (name) => `⭐ ${name}, how was your holiday? Leave a review!`,
  reviewHeading: (name) => `How was your holiday, ${name}?`,
  reviewSubtext: 'We hope you had a fantastic time on the Costa Brava! Your opinion helps other holidaymakers make their choice — and it only takes 1 minute.',
  reviewDateRange: (from, to) => `${from} to ${to}`,
  reviewRateQuestion: 'How would you rate your experience?',
  reviewButton: 'Leave a Google Review ⭐',
  reviewThanks: 'By leaving a review you help us and other holidaymakers. Thank you so much! 🙏',
  reviewFeedbackTitle: '<strong>Was something not right?</strong> Let us know so we can improve. You can always reach us via the contact form.',
  reviewFeedbackButton: 'Give feedback →',
};

const es: EmailTranslations = {
  lang: 'es',
  footerTagline: 'Caravanas en la Costa Brava',
  footerContact: 'Contacto',
  footerPrivacy: 'Privacidad',
  footerTerms: 'Condiciones',
  footerCopyright: 'Todos los derechos reservados.',
  spamNotice: '📬 ¿No has recibido un correo? Revisa tu carpeta de spam o correo no deseado y añade <strong>info@caravanverhuurspanje.com</strong> a tus contactos.',
  dateLocale: 'es-ES',

  // Welcome
  welcomeBadge: 'BIENVENIDO',
  welcomeSubject: (name) => `¡Bienvenido a Caravanverhuur Spanje, ${name}! ☀️`,
  welcomeHeading: (name) => `¡Hola ${name}!`,
  welcomeSubtext: '¡Qué bueno que hayas creado una cuenta! Ya estás listo para reservar tus vacaciones de ensueño en la Costa Brava.',
  welcomeCard1: 'Ver y reservar caravanas',
  welcomeCard2: 'Reservas y pagos',
  welcomeCard3: 'Checklist de fianza',
  welcomeTip: '<strong>🌴 ¿Sabías que?</strong> Todas nuestras caravanas están en ubicaciones privilegiadas en la Costa Brava española, con acceso directo a playas, restaurantes y mercados locales.',
  welcomeButton: 'Ver nuestras caravanas →',
  welcomePreheader: '¡Bienvenido a Caravanverhuur Spanje — tu cuenta está lista!',

  // Booking
  bookingBadge: 'NUEVA RESERVA',
  bookingSubject: (ref) => `Reserva ${ref} confirmada ✅`,
  bookingHeading: 'Reserva recibida',
  bookingSubtext: (name) => `¡Gracias ${name}! Paga el anticipo (25%) para confirmar tu reserva.`,
  bookingRefLabel: 'Número de referencia',
  bookingAwaitConfirm: '💳 Paga para confirmar',
  bookingAwaitPaymentLink: '⏳ Enlace de pago próximamente',
  bookingCaravan: 'Caravana',
  bookingCamping: 'Camping',
  bookingSpot: 'Parcela',
  bookingCheckIn: 'Check-in',
  bookingCheckOut: 'Check-out',
  bookingNights: 'Noches',
  bookingGuests: 'Huéspedes',
  bookingAdults: 'adultos',
  bookingChildren: 'niños',
  bookingTotalPrice: 'Precio total',
  bookingPayBefore: '💳 Anticipo (25%)',
  bookingRestOnCamping: '💰 Resto (75%) — en el camping (efectivo o tarjeta/PIN)',
  bookingBorgOnCamping: '🔒 Fianza — en el camping (efectivo o tarjeta/PIN)',
  bookingDirectPayment: 'Inmediatamente al reservar',
  bookingImmediateNote: (price, _) => `<strong>Resumen de pago:</strong> El anticipo del 25% debe pagarse ahora vía iDEAL/Wero en tu cuenta. El importe restante y la fianza se pagan en el camping (efectivo o tarjeta/PIN).`,
  bookingPendingPaymentNote: (price, _) => `<strong>Resumen de pago:</strong> Recibirás un enlace de pago por correo electrónico en breve para pagar el anticipo del 25% vía iDEAL/Wero. El importe restante y la fianza se pagan en el camping (efectivo o tarjeta/PIN).`,
  bookingLaterNote: (price, deadline) => `<strong>Resumen de pago:</strong> Paga el anticipo del 25% antes del ${deadline} vía iDEAL/Wero en tu cuenta. El importe restante y la fianza se pagan en el camping (efectivo o tarjeta/PIN).`,
  bookingPayNow: (amount: string) => `Pagar anticipo ${amount} →`,
  bookingButton: 'Ir a mi cuenta →',
  bookingBeddingReminder: '🛏️ <strong>ATENCIÓN:</strong> No has reservado ropa de cama. ¡No olvides traer tus propios edredones, almohadas y sábanas bajeras! ¿Quieres añadir ropa de cama? Contáctanos.',
  // Payment link email
  paymentLinkSubject: (ref) => `Enlace de pago para reserva ${ref} 💳`,
  paymentLinkHeading: 'Enlace de pago disponible',
  paymentLinkText: (name, ref, amount) => `¡Hola ${name}! El enlace de pago para tu reserva <strong>${ref}</strong> ya está disponible. Paga el anticipo de <strong>${amount}</strong> a través del botón de abajo.`,
  paymentLinkButton: (amount) => `Pagar ${amount} anticipo →`,
  countdownBeddingReminder: '🛏️ <strong>Ropa de cama:</strong> No has reservado ropa de cama. ¡No olvides traer tus propios edredones, almohadas y sábanas bajeras!',

  // Manual booking
  manualBadge: 'RESERVA TELEFÓNICA',
  manualSubject: (ref) => `Reserva ${ref} — enlace de pago y datos`,
  manualHeading: 'Tu reserva ha sido creada',
  manualSubtext: (name) => `¡Hola ${name}! Tras nuestra conversación telefónica, hemos creado una reserva para ti. A continuación encontrarás todos los datos y el enlace de pago.`,
  manualConfirmed: '✅ Confirmada',
  manualPayNote: '<strong>Paga el anticipo (25%) a través del botón de abajo.</strong> Serás redirigido a una página de pago segura iDEAL/Wero. El importe restante y la fianza se pagan en el camping (efectivo o tarjeta/PIN).',
  manualPayButton: (price) => `Pagar ${price} anticipo vía iDEAL →`,
  manualPayLater: 'O paga más tarde a través de tu panel personal',
  manualAccountTitle: '🔐 Tu cuenta',
  manualAccountDesc: 'Se ha creado automáticamente una cuenta para que puedas gestionar tu reserva, realizar pagos y consultar tu fianza.',
  manualEmail: 'Email',
  manualPassword: 'Contraseña',
  manualChangePassword: 'Puedes cambiar tu contraseña después de iniciar sesión.',
  manualLoginButton: 'Iniciar sesión →',

  // Payment
  paymentBadge: 'PAGO RECIBIDO',
  paymentSubject: (ref) => `Pago recibido — ${ref}`,
  paymentHeading: '¡Pago exitoso!',
  paymentSubtext: (name) => `Gracias ${name}, tu pago ha sido recibido y procesado correctamente.`,
  paymentTypeRental: 'Importe del alquiler',
  paymentTypeDeposit: 'Pago de depósito',
  paymentTypeRemaining: 'Pago restante',
  paymentTypeBorg: 'Fianza',
  paymentPaidOn: (date) => `✓ Pagado el ${date}`,
  paymentRef: 'Referencia',
  paymentType: 'Tipo',
  paymentAmount: 'Importe',
  paymentButton: 'Ver mi cuenta →',
  paymentBookingOverview: 'Resumen de la reserva',
  paymentTotalPrice: 'Precio total del alquiler',
  paymentDepositPaid: 'Anticipo pagado',
  paymentRestOnCamping: 'Pago restante — en el camping (efectivo o tarjeta/PIN)',
  paymentBorgOnCamping: 'Fianza — en el camping (efectivo o tarjeta/PIN)',

  // Contact
  contactBadge: 'MENSAJE RECIBIDO',
  contactSubject: 'Hemos recibido tu mensaje',
  contactHeading: '¡Gracias por tu mensaje!',
  contactSubtext: (name, subject) => `Hola ${name}, hemos recibido tu mensaje sobre "<em>${subject}</em>" y nos pondremos en contacto contigo lo antes posible.`,
  contactResponseTime: '<strong>Tiempo de respuesta:</strong> Normalmente respondemos en 24 horas. Para preguntas urgentes, también puedes contactarnos por WhatsApp o teléfono.',
  contactButton: 'Ver nuestros datos de contacto →',

  // Reply
  replyBadge: 'RESPUESTA A TU MENSAJE',
  replySubject: (subject) => `Respuesta a tu mensaje: ${subject}`,
  replyHeading: (name) => `¡Hola ${name}!`,
  replySubtext: (subject) => `Hemos respondido a tu mensaje sobre "<em>${subject}</em>".`,
  replyLabel: 'Nuestra respuesta:',
  replyFollowUp: '¿Tienes más preguntas? No dudes en responder a este email o contactarnos a través de nuestra web.',
  replyButton: 'Contactar →',

  // Borg
  borgBadge: 'INSPECCIÓN',
  borgSubject: (ref) => `Checklist de fianza listo — ${ref}`,
  borgHeading: 'Inspección completada',
  borgSubtext: (name, typeLabel) => `Hola ${name}, la inspección de ${typeLabel} de tu reserva ha sido completada. Revisa los resultados y da tu aprobación.`,
  borgBooking: 'Reserva',
  borgCheckInType: '📥 Inspección de check-in',
  borgCheckOutType: '📤 Inspección de check-out',
  borgNote: 'Revisa la checklist y da tu aprobación o presenta una objeción. Puedes hacerlo a través del enlace de abajo o desde tu cuenta.',
  borgButton: 'Ver checklist y responder →',
  borgDashboardLink: 'O ver desde tu cuenta →',
  borgConfirmSubject: (ref) => `Confirmación de fianza — ${ref}`,
  borgConfirmHeading: 'Inspección de fianza aceptada',
  borgConfirmSubtext: (name) => `Hola ${name}, gracias por tu aprobación de la inspección de fianza. A continuación encontrarás un resumen del reembolso.`,
  borgReturnMethodLabel: 'Reembolso vía',
  borgReturnCash: '💵 Efectivo (en el camping)',
  borgReturnBank: '🏦 Transferencia bancaria (1-5 días hábiles)',
  borgRefundAmount: 'Importe a recibir',
  borgConfirmNote: 'Tu fianza será reembolsada según el método elegido. Las transferencias bancarias pueden tardar 1-5 días hábiles.',
  borgConfirmDashboardLink: 'Ver estado en tu cuenta →',

  // Delete
  deleteBadge: 'ELIMINAR CUENTA',
  deleteSubject: 'Confirma la eliminación de tu cuenta',
  deleteHeading: 'Eliminar cuenta',
  deleteSubtext: (name) => `Hola ${name}, hemos recibido una solicitud para eliminar tu cuenta.`,
  deleteWarning: '<strong>Esto es irreversible.</strong> Todos los datos, reservas e historial de pagos se eliminarán permanentemente.',
  deleteInstruction: 'Haz clic en el botón de abajo para confirmar la eliminación. Este enlace es válido durante <strong>24 horas</strong>.',
  deleteButton: 'Sí, eliminar mi cuenta →',
  deleteIgnore: '¿No solicitaste esto? Ignora este email — no se eliminará nada.',

  // Countdown
  countdownBadge: 'CUENTA ATRÁS',
  countdownHi: (name) => `¡Hola ${name}, tus vacaciones se acercan!`,
  countdownWeeks: 'semanas',
  countdownDays: 'días',
  countdownTip: '<strong>Consejo:</strong> Guarda nuestros datos de contacto para tu viaje. Para preguntas puedes contactarnos en info@caravanverhuurspanje.com o WhatsApp.',
  countdown30Subject: '¡Faltan 30 días — tus vacaciones se acercan!',
  countdown30Text: '¡En exactamente 30 días empiezan tus vacaciones en la Costa Brava! Es hora de empezar a hacer las maletas.',
  countdown14Subject: '¡Solo 2 semanas para la Costa Brava!',
  countdown14Text: '¡Las vacaciones están casi aquí! Solo dos semanas más y disfrutarás del sol, el mar y la hermosa Costa Brava.',
  countdown7Subject: '¡Tus vacaciones empiezan la próxima semana!',
  countdown7Text: '¡Solo queda una semana! ¿Lo tienes todo preparado? No olvides tus documentos de viaje y lleva suficiente protector solar.',
  countdown3Subject: '¡En 3 días estarás de vacaciones!',
  countdown3Text: '¡Ya casi es el momento! Solo tres noches más y estarás en tu destino vacacional. ¡Lo tenemos todo listo!',
  countdown1Subject: '¡Tus vacaciones empiezan mañana!',
  countdown1Text: '¡Mañana es el día! Esperamos que tengas un viaje fantástico. La caravana está limpia y lista para tu llegada.',
  countdownDefaultSubject: (days) => `¡Faltan ${days} días para tus vacaciones!`,
  countdownDefaultText: (days) => `Tus vacaciones en la Costa Brava se acercan cada vez más. ¡Solo faltan ${days} días!`,
  countdownButton: 'Ver mi reserva →',

  // Password reset
  resetBadge: 'RESTABLECER CONTRASEÑA',
  resetSubject: '🔑 Restablecer contraseña',
  resetHeading: (name) => `Hola ${name}`,
  resetSubtext: 'Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para establecer una nueva contraseña.',
  resetButton: 'Establecer nueva contraseña →',
  resetExpiry: 'Este enlace es válido durante <strong>1 hora</strong>. ¿No lo solicitaste? Puedes ignorar este email de forma segura.',

  // Verification
  verifyBadge: 'VERIFICACIÓN DE EMAIL',
  verifySubject: '✉️ Confirma tu dirección de email',
  verifyHeading: 'Confirma tu dirección de email',
  verifySubtext: (name) => `Hola ${name}, haz clic en el botón de abajo para confirmar tu dirección de email. Así nos aseguramos de poder contactarte en la dirección correcta.`,
  verifyButton: 'Confirmar dirección de email →',
  verifyExpiry: 'Este enlace es válido durante 24 horas. Si no creaste una cuenta, puedes ignorar este email.',

  // Payment reminder
  reminderBadge: 'RECORDATORIO DE PAGO',
  reminderUrgentSubject: (days, ref) => `⚠️ Pago requerido — ${days} días hasta la llegada (${ref})`,
  reminderNormalSubject: (ref) => `Recordatorio: pago de tus vacaciones (${ref})`,
  reminderUrgentHeading: '¡Acción requerida!',
  reminderNormalHeading: 'Pago pendiente',
  reminderSubtext: (name, days) => `Estimado ${name}, el pago de tu reserva aún no se ha recibido. Tu llegada es en <strong>${days} días</strong>.`,
  reminderToPay: 'Pendiente de pago',
  reminderForBooking: (ref) => `Pago de la reserva ${ref}`,
  reminderRef: 'Referencia',
  reminderArrival: 'Llegada',
  reminderOutstanding: 'Pendiente',
  reminderPayNote: '<strong>💡 Paga fácilmente vía iDEAL/Wero</strong> desde tu cuenta. El pago se procesa inmediatamente.',
  reminderUrgentNote: '<br/><br/>⚠️ <strong>Atención:</strong> sin pago tu estancia no puede realizarse.',
  reminderButton: 'Pagar ahora →',

  // Cancellation
  cancelBadge: 'CANCELACIÓN CONFIRMADA',
  cancelSubject: (ref) => `❌ Reserva cancelada — ${ref}`,
  cancelHeading: 'Reserva cancelada',
  cancelSubtext: (name) => `Hola ${name}, tu reserva ha sido cancelada exitosamente. A continuación encontrarás los detalles.`,
  cancelRef: 'Referencia',
  cancelRefundLabel: (pct) => `Reembolso: ${pct}%`,
  cancelRefundNote: 'Los reembolsos se procesan en un plazo de 7 días hábiles. Si tienes preguntas, no dudes en contactarnos.',
  cancelButton: 'Contactar →',

  // Review
  reviewBadge: 'RESEÑA',
  reviewSubject: (name) => `⭐ ${name}, ¿cómo fueron tus vacaciones? ¡Deja una reseña!`,
  reviewHeading: (name) => `¿Cómo fueron tus vacaciones, ${name}?`,
  reviewSubtext: '¡Esperamos que hayas pasado un tiempo fantástico en la Costa Brava! Tu opinión ayuda a otros viajeros a elegir — y solo te tomará 1 minuto.',
  reviewDateRange: (from, to) => `${from} a ${to}`,
  reviewRateQuestion: '¿Cómo calificarías tu experiencia?',
  reviewButton: 'Dejar una reseña en Google ⭐',
  reviewThanks: 'Al dejar una reseña nos ayudas a nosotros y a otros viajeros. ¡Muchas gracias! 🙏',
  reviewFeedbackTitle: '<strong>¿Algo no estuvo bien?</strong> Haznos saber para que podamos mejorar. Siempre puedes contactarnos a través del formulario de contacto.',
  reviewFeedbackButton: 'Dar feedback →',
};

const translations: Record<EmailLocale, EmailTranslations> = { nl, en, es };

export function getEmailTranslations(locale?: string): EmailTranslations {
  if (locale && locale in translations) return translations[locale as EmailLocale];
  return translations.nl; // Default to Dutch
}
