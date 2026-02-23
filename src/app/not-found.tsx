'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6">
          <Image
            src="https://u.cubeupload.com/laurensbos/Caravanverhuur.png"
            alt="Caravanverhuur Costa Brava"
            fill
            className="object-contain rounded-2xl opacity-30"
            unoptimized
          />
        </div>
        <h1 className="text-6xl sm:text-8xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Pagina niet gevonden</h2>
        <p className="text-muted text-sm sm:text-base mb-8">
          Oeps! Deze pagina bestaat niet of is verplaatst. Misschien zijn we net bezig met de caravan parkeren...
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-all active:scale-95"
          >
            <Home size={18} />
            Naar Home
          </Link>
          <Link
            href="/caravans"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-white transition-all active:scale-95"
          >
            Bekijk Caravans
            <ArrowRight size={18} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
