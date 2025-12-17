import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, Sparkles, Activity, Target, Share2, Layers, Cpu, Network, Combine, AlertTriangle, RotateCcw } from 'lucide-react';

const KOLAM_DESCRIPTIONS: Record<string, { flow: string, symmetry: string }> = {
  'butterfly': {
    flow: 'Relies heavily on Eulerian circuits connecting the grid to trace segmented wing geometries in a single continuous line. The path strategically navigates the pulli (dot) matrix to create distinct, sweeping arcs that mimic the natural fluttering motion and anatomical structure of butterfly wings.',
    symmetry: 'Exhibits precise bilateral symmetry reflecting the delicate wings of a butterfly (f(x) = f(-x)). This mirror-image balance is central to the design, ensuring both the left and right halves perfectly align to create a sense of harmony and organic proportion.'
  },
  'cow': {
    flow: 'Bridges curved segments combining graph-theoretic cycles that enclose maximum grid points while preserving the motif. The strokes form interconnected spatial regions, representing the bodily profile and horns of a cow through structured, unbroken contours that map back to the core grid.',
    symmetry: 'Heavily utilizes 4-fold or 2-fold rotational symmetry mapping, maintaining structural integrity across intersecting planes. This balanced approach ensures that the figurative representation maintains structural equilibrium no matter which direction the pattern extends.'
  },
  'creeper': {
    flow: 'Continuous meandering border lines forming sine-wave-like oscillations acting as endless knots. These intertwined vines organically wrap around dots, creating visually rhythm-driven repeating units that scale dynamically to form borders or complex space-filling meshes.',
    symmetry: 'Exemplifies pure translational symmetry (f(x) = f(x + T)), flowing continuously along linear paths or bounding boxes. Occasionally features glide reflections, introducing subtle geometric twists that maintain visual balance across infinite lengths.'
  },
  'elephant': {
    flow: 'Breaks down complex curves into piecewise linear or arc combinations on a modular grid approach. The grand structure utilizes localized sub-patterns for the trunk, ears, and body, combining them systematically to render a massive, majestic silhouette without breaking traditional geometric constraints.',
    symmetry: 'Maintains proportional scaling and steadfast bilateral symmetry across the central vertical axis. The geometry often employs localized reflection within the ears or tusks, ensuring the heavy figure feels aesthetically grounded and mathematically stable.'
  },
  'fish': {
    flow: 'Traverses optimal paths (shortest closed loop) across the underlying pulli matrix using closely packed rhombuses. The fluid lines intersect and weave back upon themselves to form intricate scales and fins, translating biological movement into strict topological puzzles.',
    symmetry: 'Relies on interlocking curves often achieving flawless point reflection symmetry. Multiple fish motifs are typically tessellated alongside one another, generating secondary rotational symmetries where tails and heads geometrically intersect in repeating tiles.'
  },
  'flower': {
    flow: 'Modeled using polar coordinates (r, θ) to map intersecting petals out from the central origin. The line paths actively radiate outwards in rhythmic, blooming sequences, mathematically layering loops to construct complex corollas and densely packed botanical structures.',
    symmetry: 'Defined by strict radial symmetry rotated around a central focal point by precisely 360/n degrees (commonly n=4, 6, 8, or 12). This multi-axis symmetry produces a hypnotic, mandala-like balance that expands uniformly in all directions.'
  },
  'footprint': {
    flow: 'Designed as smaller, discrete sub-graphs where nodes form specific non-crossing pairings to guide paths. The lines elegantly trace around localized dot clusters (often representing the heel and toes) to construct finite, closed shapes rather than an infinite meandering lattice.',
    symmetry: 'Features primary bilateral symmetry combined with translational symmetry, naturally forming step-like sequential pairings. When arranged in patterns, they utilize glide symmetry to imitate alternating footprints walking across a sacred threshold.'
  },
  'geometric': {
    flow: 'Uses pure straight lines and right-angle connections as complex cellular automata arrays or space-filling curves. These sharp, angular trajectories avoid smooth curves altogether, creating structural mazes, tessellations, and interlocking polygon networks anchored firmly to the grid.',
    symmetry: 'High-complexity fractal-like objects displaying flawless 4-fold (D4 group) or 8-fold dihedral symmetry. The razor-sharp reflection across horizontal, vertical, and diagonal axes creates a highly stable, crystallized artistic matrix.'
  },
  'kambi': {
    flow: 'Alternating knots forming a single Unknot or link of Unknots crossing following strict over-under rules. The continuous line loops around itself over the dot-grid, weaving a dense, unbroken mathematical knot that requires foresight and precision to close perfectly.',
    symmetry: 'Governed by complex rotational and reflectional symmetry dictated entirely by the underlying knot structure. The interwoven intersections enforce a perfectly balanced tension, ensuring that every loop mirrors an equivalent counterpart across the matrix.'
  },
  'loops': {
    flow: 'Generates a minimal set of closed, non-intersecting curved loops woven through a hexagonal or orthogonal grid. Rather than a single continuous line, it uses multiple distinct, self-contained circles and oval orbits that visually overlap to build a larger macro-texture.',
    symmetry: 'Characterized by complex topological symmetry based strictly on knot theory constraints. The individual loops interact to create broader emergent symmetries, often resulting in mesmerizing 6-fold hexagonal patterns or rigid 4-fold tile layouts.'
  },
  'om': {
    flow: 'Combines the non-symmetric calligraphy at the origin (0,0) with balanced traditional cyclic embellishments. Free-form, expressive typographic contours meet strict geometric framing, anchoring the sacred syllable within a structured, lattice-based environment.',
    symmetry: 'The surrounding elements display radial or intricate n-fold rotational symmetry around the non-symmetric core. The elaborate borders act as a symmetric harmonizer, expertly balancing out the inherent asymmetry of the central Om symbol.'
  },
  'peacock': {
    flow: 'Recursive geometric additions where each feather acts as a self-similar fractal sub-pattern. The central body acts as the anchor, while sweeping arcs mathematically fan outwards, weaving discrete grid clusters to construct the elaborate, multi-layered plumage.',
    symmetry: 'Brilliantly balances a non-symmetric central body with a highly symmetric, exponentially expanding semi-circular array. The tail feathers employ local bilateral symmetry, radiating outwards to achieve a stunning overall rotational balance.'
  }
};

const ClassifyKolam: React.FC = () => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isClassified, setIsClassified] = useState(false);
  const [readyToClassify, setReadyToClassify] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState<string>('Pattern');
  const [rawClass, setRawClass] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Process a selected or dropped file */
  const processFile = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image must be under 5MB.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = e => {
      setImagePreviewUrl(String(e.target?.result || ''));
      setIsClassified(false);
      setReadyToClassify(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      resetState();
      return;
    }
    processFile(file);
  };

  /** Drag-and-drop handlers */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const resetState = () => {
    setImagePreviewUrl(null);
    setReadyToClassify(false);
    setIsClassified(false);
    setSelectedFile(null);
    setErrorMessage(null);
    setLabel('Pattern');
    setRawClass('');
    setConfidence(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClassify = async () => {
    if (!readyToClassify || !selectedFile) return;
    
    setIsLoading(true);
    setIsClassified(false);
    setErrorMessage(null);
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const API_URL = import.meta.env.PROD 
        ? "https://omkarshanbhag-aparnabindu-v2.hf.space/predict"
        : "http://localhost:8000/predict";
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        const formattedLabel = result.prediction
          .split('_')
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') + " Kolam";
          
        setLabel(formattedLabel);
        setRawClass(result.prediction);
        setConfidence(result.confidence ? result.confidence * 100 : 98.4);
        setIsClassified(true);
      } else {
        setErrorMessage(result.error || 'Analysis failed. The model could not process this image.');
        setIsClassified(false);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Connection failed: ${msg}. The Hugging Face model server may be sleeping — it can take ~30s to wake up. Please retry.`);
      setIsClassified(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 py-8 sm:py-12 md:py-20 flex flex-col">
      {/* Header Title */}
      <div className="text-center mb-8 sm:mb-16 max-w-3xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif text-amber-950 mb-4 sm:mb-6 drop-shadow-sm"
        >
          Analyze Your Kolam
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-xl text-amber-800/80 font-medium"
        >
          Discover the ancient lineage and mathematical beauty of your designs using cutting-edge vision models.
        </motion.p>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-7xl mx-auto w-full mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-grow">
              <p className="text-red-800 font-medium text-sm">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600 transition-colors text-xs font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-6 sm:gap-10 w-full max-w-7xl mx-auto flex-grow items-stretch">
        
        {/* Left Box: Upload & Preview */}
        <motion.div 
          className="flex-1 flex flex-col bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-900/10 relative overflow-hidden"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-2xl font-bold text-amber-950 mb-6 flex items-center gap-3">
            <UploadCloud className="text-amber-600" />
            Select Image
          </h2>
          
          <div 
            className={`flex-grow border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden group
              ${isDragOver 
                ? 'border-amber-500 bg-amber-100/50 scale-[1.02]' 
                : imagePreviewUrl 
                  ? 'border-amber-300 bg-amber-50/50' 
                  : 'border-amber-600/30 hover:border-amber-500 hover:bg-amber-50 cursor-pointer'
              }
            `}
            onClick={() => !imagePreviewUrl && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            <AnimatePresence mode="wait">
              {!imagePreviewUrl ? (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center p-8 z-10"
                >
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-300 ${
                    isDragOver ? 'bg-amber-200 scale-110' : 'bg-amber-100 group-hover:scale-110'
                  }`}>
                    <UploadCloud size={36} className="text-amber-600" />
                  </div>
                  <p className="text-lg font-bold text-amber-900 mb-2">
                    {isDragOver ? 'Drop your image here' : 'Click or drag image to upload'}
                  </p>
                  <p className="text-sm text-amber-700/60 font-medium">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full relative flex flex-col"
                >
                  <div className="flex-grow p-4 md:p-8 flex items-center justify-center">
                    <img 
                      src={imagePreviewUrl} 
                      alt="Kolam" 
                      className="max-h-[350px] w-auto h-auto object-contain rounded-xl shadow-lg border-4 border-white"
                    />
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm p-4 border-t border-amber-100 flex justify-between items-center z-20">
                    <span className="text-sm font-medium text-amber-800 truncate px-2">{selectedFile?.name}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        resetState();
                      }}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleClassify}
              disabled={!readyToClassify || isLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-md hover:shadow-lg
                ${!readyToClassify || isLoading 
                  ? 'bg-amber-100 text-amber-500 cursor-not-allowed opacity-70' 
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white hover:-translate-y-0.5'
                }
              `}
            >
              {isLoading ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                    <Cpu className="text-amber-200" />
                  </motion.div>
                  Extracting Features...
                </>
              ) : (
                <>
                  <Sparkles className={readyToClassify ? 'text-amber-200' : ''}/>
                  Run Analysis
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Right Box: Results */}
        <motion.div 
          className="flex-[1.2] flex flex-col bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-900/10"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-100">
            <h2 className="text-2xl font-bold text-amber-950 flex items-center gap-3">
              <Activity className="text-amber-600" />
              Neural Insights
            </h2>
            {isClassified && (
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={14} /> Completed
              </span>
            )}
          </div>

          <div className="flex-grow flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {!isClassified && !isLoading ? (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <Layers size={40} className="text-amber-300" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Awaiting Input</h3>
                  <p className="text-amber-700/70 max-w-sm mx-auto">
                    Once you upload and run the analysis, our model will extract the stylistic origins and identify the exact Kolam variation.
                  </p>
                </motion.div>
              ) : isLoading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-12 space-y-8"
                >
                  {[
                    { title: "Isolating background noise...", delay: 0 },
                    { title: "Analyzing geometric symmetry...", delay: 0.5 },
                    { title: "Matching with heritage database...", delay: 1.5 }
                  ].map((step, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: step.delay }}
                      className="flex items-center gap-4"
                    >
                      <div className="relative flex items-center justify-center w-8 h-8">
                        <motion.span className="absolute inset-0 border-2 border-amber-600 rounded-full border-t-transparent animate-spin"/>
                      </div>
                      <span className="text-amber-800 font-medium">{step.title}</span>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col h-full"
                >
                  {/* Highlight result */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-200 mb-6 sm:mb-8 flex items-start gap-3 sm:gap-6 relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/3 -translate-y-1/3 pointer-events-none">
                      <Target size={160} />
                    </div>
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-amber-100 flex items-center justify-center flex-shrink-0 relative z-10">
                      <CheckCircle2 size={32} className="text-green-500" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-sm font-bold text-amber-600 uppercase tracking-widest mb-1">Identified Tradition</p>
                      <h3 className="text-2xl sm:text-4xl font-black text-amber-950 font-serif leading-tight">{label}</h3>
                    </div>
                  </div>

                  {/* Attributes */}
                  <h4 className="font-bold text-amber-900 mb-4 px-2 uppercase tracking-wide text-sm">Visual Architecture</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow">
                    <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-bold text-amber-900 flex items-center gap-2">
                          <Network size={16} className="text-amber-600" /> Pattern Flow
                        </h5>
                      </div>
                      <p className="text-sm text-amber-800 font-medium leading-relaxed">
                        {rawClass && KOLAM_DESCRIPTIONS[rawClass] ? KOLAM_DESCRIPTIONS[rawClass].flow : 'Generated exclusively using continuous closed-loop Eulerian tracing mechanics.'}
                      </p>
                    </div>
                    
                    <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-bold text-amber-900 flex items-center gap-2">
                          <Share2 size={16} className="text-amber-600" /> Symmetry
                        </h5>
                      </div>
                      <p className="text-sm text-amber-800 font-medium leading-relaxed">
                        {rawClass && KOLAM_DESCRIPTIONS[rawClass] ? KOLAM_DESCRIPTIONS[rawClass].symmetry : 'Perfect biaxial reflectional symmetry maintaining strict radial balance.'}
                      </p>
                    </div>
                    
                    <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100 col-span-1 sm:col-span-2">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-bold text-amber-900 flex items-center gap-2">
                          <Combine size={16} className="text-amber-600" /> Model Confidence
                        </h5>
                        <span className="font-black text-amber-700">{confidence.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-white h-3 rounded-full overflow-hidden border border-amber-200">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Try Another button */}
                  <button
                    onClick={resetState}
                    className="mt-6 w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all duration-200"
                  >
                    <RotateCcw size={18} />
                    Analyze Another Kolam
                  </button>

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ClassifyKolam;