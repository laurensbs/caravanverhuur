'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';
import { getCaravanById } from '@/data/caravans';
import { useState } from 'react';

export default function CaravanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const caravan = getCaravanById(id);
  const [activePhoto, setActivePhoto] = useState(0);

  if (!caravan) {
    notFound();
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/caravans" className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors">
            <ArrowLeft size={16} />
            Terug naar caravans
          </Link>
        </div>
      </div>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Photos */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
              <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden mb-4">
                <Image
                  src={caravan.photos[activePhoto]}
                  alt={caravan.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-4 py-1.5 rounded-full text-sm font-semibold text-white ${
                    caravan.type === 'LUXE' ? 'bg-yellow-500' :
                    caravan.type === 'FAMILIE' ? 'bg-primary' : 'bg-green-500'
                  }`}>
                    {caravan.type}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {caravan.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`relative h-24 rounded-xl overflow-hidden border-2 transition-all ${
                      activePhoto === i ? 'border-primary shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={photo} alt={`Foto ${i + 1}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-3 italic">
                * Foto&apos;s zijn van deze caravan of een vergelijkbaar model. De exacte caravan kan afwijken.
              </p>
            </motion.div>

            {/* Details */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="mb-2">
                <span className="text-sm text-accent font-semibold">{caravan.reference}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{caravan.name}</h1>
              <div className="flex items-center gap-4 text-muted mb-6">
                <span className="flex items-center gap-1"><Users size={16} /> Max {caravan.maxPersons} personen</span>
                <span>{caravan.manufacturer} &bull; {caravan.year}</span>
              </div>
              <p className="text-muted text-lg leading-relaxed mb-8">{caravan.description}</p>

              {/* Pricing */}
              <div className="bg-surface rounded-2xl p-6 mb-8 border border-border">
                <h3 className="font-semibold text-foreground mb-4">Prijzen</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">&euro;{caravan.pricePerDay}</div>
                    <div className="text-sm text-muted">per dag</div>
                  </div>
                  <div className="text-center border-x border-border">
                    <div className="text-2xl font-bold text-primary">&euro;{caravan.pricePerWeek}</div>
                    <div className="text-sm text-muted">per week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-accent">&euro;{caravan.deposit}</div>
                    <div className="text-sm text-muted">borg</div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4">Voorzieningen</h3>
                <div className="grid grid-cols-2 gap-3">
                  {caravan.amenities.map(a => (
                    <div key={a} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                      <span className="text-sm">{a}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory */}
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4">Inventaris (inbegrepen)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {caravan.inventory.map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-primary shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="flex gap-4">
                <Link
                  href={`/boeken?caravan=${caravan.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                >
                  Boek deze caravan
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all duration-300"
                >
                  Vraag?
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
