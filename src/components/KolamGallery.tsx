import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { assetUrl } from '../utils';
import kolamDataJson from '../data/gallery-data.json';

interface KolamData {
  id: number;
  type: string;
  imageUrl: string;
  href?: string;
  description?: string;
}

interface KolamCardProps {
  type: string;
  imageUrl: string;
  index: number;
  href?: string;
  description?: string;
}

const kolamData: KolamData[] = kolamDataJson as KolamData[];

const KolamCard: React.FC<KolamCardProps> = ({ type, imageUrl, index, href = '#' }) => {
  return (
    <motion.div
      className="relative group col-span-1 h-64"
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
    >
      <Link to={href} className="block w-full h-full">
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-lg border border-amber-200/40 bg-white/20 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 group">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src={assetUrl(imageUrl)}
              alt={type}
              className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-950/90 via-amber-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500"></div>
          </div>
          
          <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
            <div className="transform transition-transform duration-500 group-hover:-translate-y-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-3xl font-bold font-serif text-amber-50 group-hover:text-amber-300 transition-colors duration-300">
                  {type}
                </h3>
                <Sparkles className="w-6 h-6 text-amber-300/0 group-hover:text-amber-300 transform scale-50 group-hover:scale-100 transition-all duration-500" />
              </div>
              
              <div className="flex items-center space-x-2 text-amber-300 text-sm font-semibold tracking-wide uppercase opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
                <span>View Collection</span>
                <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-2" />
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 w-0 group-hover:w-full transition-all duration-700 ease-in-out"></div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const KolamGallery: React.FC = () => {
  const filteredKolams = kolamData;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 pt-16 md:pt-24 pb-24">
      <section className="pb-8 sm:pb-16 text-center relative max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold font-serif mb-4 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-amber-800 via-orange-700 to-red-800 tracking-tight">
            Kolam Gallery
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-amber-700/90 mb-6 sm:mb-10 leading-relaxed font-medium">
            A vibrant collection of traditional and contemporary Kolam designs celebrating the rich floor art heritage of South India.
          </p>
          
          <div className="w-32 h-1.5 mx-auto bg-gradient-to-r from-amber-300 via-orange-400 to-red-400 rounded-full shadow-sm mb-8"></div>
        </motion.div>
      </section>

      <section>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          layout
        >
          <AnimatePresence>
            {filteredKolams.length > 0 ? (
              filteredKolams.map((kolam, index) => (
                <KolamCard
                  key={kolam.id}
                  type={kolam.type}
                  imageUrl={kolam.imageUrl}
                  href={kolam.href}
                  index={index}
                  description={kolam.description}
                />
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full py-20 text-center"
              >
                <div className="w-24 h-24 mx-auto bg-amber-100/50 rounded-full flex items-center justify-center mb-6">
                  <ImageIcon className="w-10 h-10 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-2">No Kolams Found</h3>
                <p className="text-amber-700/70 max-w-sm mx-auto">
                  Check back later for new additions to the gallery.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
};

export default KolamGallery;