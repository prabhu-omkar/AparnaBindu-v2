import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import { assetUrl } from '../utils';

import classImagesDataJSON from '../data/class-images.json';
const classImagesMap: Record<string, string[]> = (classImagesDataJSON as any).default || classImagesDataJSON;

const ClassGallery: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(25);
  
  const formattedTitle = classId 
    ? classId.charAt(0).toUpperCase() + classId.slice(1) + (classId === 'om' ? ' Kolam' : ' Kolams')
    : 'Gallery';

  useEffect(() => {
    if (classId && classImagesMap[classId]) {
      setImages(classImagesMap[classId]);
      setDisplayCount(25);
    } else {
      setImages([]);
    }
  }, [classId]);

  // Handle escape key for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedImage(null);
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 md:px-10 pt-16 md:pt-24 pb-24">
        {/* Enhanced Header Section */}
        <div className="mb-12 max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <Link to="/gallery" className="inline-flex items-center text-amber-700/80 hover:text-orange-600 transition-colors font-medium text-sm md:text-base border border-amber-200/50 bg-amber-100/30 hover:bg-amber-100/60 px-4 py-2 rounded-full backdrop-blur-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Categories
            </Link>
          </motion.div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-amber-200/50 pb-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-900 via-orange-800 to-red-900">
                {formattedTitle}
              </h1>
              <p className="text-amber-700 mt-3 font-medium text-lg border-l-4 border-amber-400 pl-3">
                <span className="font-bold text-amber-800">{images.length}</span> authentic {images.length === 1 ? 'design' : 'designs'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Premium Images Grid */}
        <section className="max-w-7xl mx-auto">
          {images.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {images.slice(0, displayCount).map((src, idx) => (
                  <motion.div 
                    key={src}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, margin: "50px" }}
                    transition={{ duration: 0.4, delay: (idx % 10) * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedImage(src)}
                  >
                    <div className="relative aspect-square rounded-2xl md:rounded-3xl overflow-hidden bg-amber-100/50 shadow-md border border-transparent transition-all duration-500 group-hover:border-amber-400/50 group-hover:shadow-xl group-hover:shadow-amber-500/20 group-hover:-translate-y-1">
                      <img 
                        src={assetUrl(src)} 
                        alt={`${formattedTitle} ${idx + 1}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      <div className="absolute inset-0 bg-amber-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-white/20 p-2 md:p-3 rounded-full backdrop-blur-md transform scale-50 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 delay-100 border border-white/30 text-white">
                          <ZoomIn className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                      </div>
                      
                      <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-black/40 backdrop-blur-md text-white/90 text-[10px] md:text-xs font-semibold px-2 py-1 md:px-3 md:py-1.5 rounded-full border border-white/20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        #{idx + 1}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {displayCount < images.length && (
                <div className="mt-12 flex justify-center">
                  <button 
                    onClick={() => setDisplayCount(prev => prev + 25)}
                    className="bg-gradient-to-r from-amber-200 to-amber-300 hover:from-amber-300 hover:to-orange-400 text-amber-900 font-semibold px-8 py-3 rounded-full shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Load More Designs 
                  </button>
                </div>
              )}
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 text-center border-2 border-dashed border-amber-200/70 rounded-3xl bg-amber-50/30"
            >
              <div className="w-24 h-24 mx-auto bg-amber-100/80 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <ImageIcon size={40} className="text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">Collection Empty</h3>
              <p className="text-amber-700/80 max-w-sm mx-auto">
                We are still gathering beautiful {classId} designs. Please check back soon or explore our other vibrant categories!
              </p>
              <Link to="/gallery" className="mt-8 inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
                Explore Gallery
              </Link>
            </motion.div>
          )}
        </section>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              className="absolute top-6 right-6 lg:top-10 lg:right-10 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 p-3 rounded-full backdrop-blur-sm transition-all z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-[95vw] h-[85vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={assetUrl(selectedImage)} 
                alt="Fullscreen view" 
                className="max-w-full max-h-full w-full h-full object-contain drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClassGallery;
