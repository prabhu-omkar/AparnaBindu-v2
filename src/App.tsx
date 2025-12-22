import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/home';
import KolamGallery from './components/KolamGallery';
import ClassGallery from './components/ClassGallery';
import ClassifyKolam from './components/ClassifyKolam';
import KolamDesigner from './components/KolamDesigner';
import PulliKolam from './components/PulliKolam';

import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/gallery" element={<KolamGallery />} />
          <Route path="/gallery/:classId" element={<ClassGallery />} />
          <Route path="/gallery/pulli" element={<PulliKolam />} />
          <Route path="/classify" element={<ClassifyKolam />} />
          <Route path="/design-kolam" element={<KolamDesigner />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;