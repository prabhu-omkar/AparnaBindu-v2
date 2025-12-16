import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shapes, DraftingCompass, Clock, Users, Heart, ChevronRight, Image as ImageIcon } from 'lucide-react';

// Feature cards data — now includes Gallery as a first-class feature
const featuredKolams = [
  {
    id: 1,
    type: 'Classify Kolam',
    icon: Shapes,
    description: 'Upload any Kolam image and let our CNN-ViT hybrid model identify the tradition.',
    link: '/classify',
  },
  {
    id: 2,
    type: 'Design a Kolam',
    icon: DraftingCompass,
    description: 'Create your own geometric patterns using structural hex codes.',
    link: '/design-kolam',
  },
  {
    id: 3,
    type: 'Browse Gallery',
    icon: ImageIcon,
    description: 'Explore 2800+ curated designs across 12 traditional Kolam categories.',
    link: '/gallery',
  },
];

// Stats Data
const stats = [
  { icon: Clock, value: '5000+', label: 'Years of Tradition' },
  { icon: Users, value: '50M+', label: 'Active Practitioners' },
  { icon: Heart, value: '500+', label: 'Pattern Types' },
];

// Stagger animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

// Kolam Card Component
interface KolamCardProps {
  type: string;
  icon: React.ElementType;
  description: string;
  link: string;
}

const KolamCard: React.FC<KolamCardProps> = ({ type, icon: Icon, description, link }) => {
  return (
    <motion.div variants={itemVariants}>
      <Link to={link} className="block group h-full">
        <div className="relative rounded-2xl overflow-hidden shadow-lg h-full border border-transparent bg-gradient-to-br from-orange-100 via-orange-100 to-orange-200 text-amber-900 p-5 sm:p-8 flex flex-col transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2">
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10 flex-grow flex flex-col">
            <div className="mb-6">
              <Icon className="w-10 h-10 sm:w-16 sm:h-16 text-amber-700 group-hover:text-amber-900 transition-colors duration-300" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-3">{type}</h3>
            <p className="text-amber-800 leading-relaxed mb-6 flex-grow">{description}</p>
            <div className="mt-auto flex items-center justify-between font-semibold">
              <span>Explore Feature</span>
              <ChevronRight className="w-6 h-6 transform group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Home = () => {
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 pb-16">
      {/* Hero Section */}
      <motion.section 
        className="pt-12 sm:pt-20 pb-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold font-serif mb-4 sm:mb-6 text-amber-900">
            Welcome to the World of Kolam
          </h1>
          
          <p className="text-base sm:text-xl md:text-2xl text-amber-700 mb-6 sm:mb-10 leading-relaxed max-w-2xl mx-auto">
            Immerse yourself in the timeless beauty of South Indian floor art. 
            Learn, create, and preserve this sacred tradition that connects us to our heritage.
          </p>
        </div>
      </motion.section>

      {/* Featured Kolams */}
      <section className="pt-0 pb-12">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl sm:text-4xl font-bold font-serif text-amber-900 mb-4">
            Explore Our Features
          </h2>
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-amber-400 to-orange-400 rounded-full section-divider"></div>
        </motion.div>
      
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {featuredKolams.map((kolam) => (
            <KolamCard key={kolam.id} {...kolam} />
          ))}
        </motion.div>
      </section>

      {/* Stats Section */}
      <motion.section 
        className="py-12 border-y border-amber-200/30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="text-center group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 mb-2 sm:mb-4 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full group-hover:scale-110 transition-transform">
                <stat.icon className="w-5 h-5 sm:w-8 sm:h-8 text-amber-700" />
              </div>
              <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-amber-900 mb-1 sm:mb-2">{stat.value}</h3>
              <p className="text-xs sm:text-base text-amber-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* History Section */}
      <section className="py-20">
        <motion.div 
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl sm:rounded-3xl p-5 sm:p-10 md:p-16 shadow-2xl border border-amber-200/30 relative overflow-hidden"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
        >
          {/* Decorative Background */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-orange-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-bold font-serif text-amber-900 mb-4">
                A Heritage of Kolams
              </h2>
              <div className="w-32 h-1 mx-auto bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"></div>
            </div>

            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-base sm:text-xl md:text-2xl leading-relaxed text-amber-800 font-medium mb-6">
                The vibrant art of Kolam is an <span className="text-amber-600 font-bold">ancient cosmic code</span> woven into the very fabric of daily life in South India. 
              </p>
              
              <p className="text-sm sm:text-lg leading-relaxed text-amber-700/90 mb-6 font-serif">
                For over 5,000 years, women have risen before dawn to transform the earth at their doorsteps into breathtaking geometric tapestries. Mentioned in grand epics like the Ramayana and ancient Vedic scriptures, this is not just art—it is a sacred invitation to <span className="font-bold text-amber-900">Lakshmi, the goddess of prosperity and wealth</span>.
              </p>

              <p className="text-sm sm:text-lg leading-relaxed text-amber-700/90 mb-6 font-serif">
                Every curve and dot in a Kolam carries profound mathematical symmetry and ecological wisdom. Traditionally drawn with coarse rice flour, these intricate patterns serve as a humble morning feast for ants, birds, and tiny creatures, symbolizing a beautiful and unspoken coexistence with nature.
              </p>

              <div className="mt-6 sm:mt-10 px-4 sm:px-8 py-4 sm:py-6 border-l-4 border-r-4 border-amber-400 bg-amber-500/5 rounded-2xl shadow-inner">
                <p className="text-sm sm:text-xl leading-relaxed text-amber-900 font-serif italic text-center">
                  "Passed down purely through the hands of mothers and daughters over countless generations, Kolam remains one of the world's oldest surviving forms of generative art. It is a daily meditation, a whispered prayer in dust, and a mesmerizing testament to the harmony of the universe."
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;