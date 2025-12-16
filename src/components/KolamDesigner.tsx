import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface IntersectionData {
  [key: string]: number;
}

const getIntersectionData = (hexCode: string): IntersectionData => {
    const intersectionMap: { [key: string]: string[] } = {
        'digit_0': ['2,0.5', '2.5,1', '1.5,1', '2,1.5'],
        'digit_1': ['1,1.5', '1.5,2', '0.5,2', '1,2.5'],
        'digit_2': ['3,1.5', '3.5,2', '2.5,2', '3,2.5'],
        'digit_3': ['2,2.5', '2.5,3', '1.5,3', '2,3.5'],
    };

    const data: IntersectionData = {};
    const paddedHexCode = hexCode.padEnd(4, '0');

    for (let i = 0; i < paddedHexCode.length; i++) {
        const hexDigit = paddedHexCode[i];
        const bits = parseInt(hexDigit, 16).toString(2).padStart(4, '0');
        const coords = intersectionMap[`digit_${i}`];
        for (let j = 0; j < bits.length; j++) {
            data[coords[j]] = parseInt(bits[j], 2);
        }
    }
    return data;
};

const getIntersectionData171 = (hexCode: string): IntersectionData => {
    const intersectionMap171: { [key: string]: string[] } = {
        'digit_0': ['3,0.5', '3.5,1', '2.5,1', '3,1.5'],
        'digit_1': ['2,1.5', '2.5,2', '1.5,2', '2,2.5'],
        'digit_2': ['4,1.5', '4.5,2', '3.5,2', '4,2.5'],
        'digit_3': ['1,2.5', '1.5,3', '0.5,3', '1,3.5'],
        'digit_4': ['3,2.5', '3.5,3', '2.5,3', '3,3.5'],
        'digit_5': ['5,2.5', '5.5,3', '4.5,3', '5,3.5'],
        'digit_6': ['2,3.5', '2.5,4', '1.5,4', '2,4.5'],
        'digit_7': ['4,3.5', '4.5,4', '3.5,4', '4,4.5'],
        'digit_8': ['3,4.5', '3.5,5', '2.5,5', '3,5.5'],
    };

    const data: IntersectionData = {};
    const paddedHexCode = hexCode.padEnd(9, '0');

    Object.values(intersectionMap171).forEach(coords => {
        coords.forEach(coord => data[coord] = 0);
    });

    for (let i = 0; i < paddedHexCode.length; i++) {
        const hexDigit = paddedHexCode[i];
        const bits = parseInt(hexDigit, 16).toString(2).padStart(4, '0');
        const coords = intersectionMap171[`digit_${i}`];
        if (coords) {
            for (let j = 0; j < bits.length; j++) {
                data[coords[j]] = parseInt(bits[j], 2);
            }
        }
    }
    
    return data;
};

const KolamDesigner: React.FC = () => {
  const [hexCode, setHexCode] = useState('');
  const [hexCode171, setHexCode171] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef171 = useRef<HTMLCanvasElement>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    handleGenerate();
    handleGenerate171();
  }, []);

  const drawKolam = (canvas: HTMLCanvasElement, data: IntersectionData) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 80;
    const canvasSize = 5 * scale;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(scale / 2, scale / 2);

    const arcProps = { color: 'black', lw: 2.0 };
    const crossProps = { color: 'black', lw: 2.0 };
    
    const outerArcsParams = [
        { center: [2, 0], w: 0.7, h: 0.7, angle: 0, t1: 135, t2: 405 },
        { center: [1, 1], w: 0.7, h: 0.7, angle: -45, t1: 180, t2: 360 },
        { center: [3, 1], w: 0.7, h: 0.7, angle: 45, t1: 180, t2: 360 },
        { center: [0, 2], w: 0.7, h: 0.7, angle: 0, t1: 45, t2: 315 },
        { center: [4, 2], w: 0.7, h: 0.7, angle: 0, t1: -135, t2: 135 },
        { center: [1, 3], w: 0.7, h: 0.7, angle: 45, t1: 0, t2: 180 },
        { center: [3, 3], w: 0.7, h: 0.7, angle: -45, t1: 0, t2: 180 },
        { center: [2, 4], w: 0.7, h: 0.7, angle: 0, t1: -45, t2: 225 },
    ];

    const pulliDots: [number, number][] = [];
    for (let r = 0; r < 5; r++) {
      const numDots = 5 - 2 * Math.abs(r - 2);
      const startX = Math.abs(r - 2);
      for (let i = 0; i < numDots; i++) {
        const c = startX + i;
        pulliDots.push([c, r]);
      }
    }

    const yellowStyleCoords = new Set(['2,0.5', '1,1.5', '2,1.5', '3,1.5', '1,2.5', '2,2.5', '3,2.5', '2,3.5']);
    const greenStyleCoords = new Set(['1.5,1', '2.5,1', '0.5,2', '1.5,2', '2.5,2', '3.5,2', '1.5,3', '2.5,3']);

    pulliDots.forEach(([c, r]) => {
        ctx.beginPath();
        ctx.arc(c * scale, r * scale, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    });

    outerArcsParams.forEach(p => {
        ctx.strokeStyle = arcProps.color;
        ctx.lineWidth = arcProps.lw;
        ctx.beginPath();
        const radius = (p.w / 2) * scale;
        ctx.ellipse(p.center[0] * scale, p.center[1] * scale, radius, radius, p.angle * Math.PI / 180, p.t1 * Math.PI / 180, p.t2 * Math.PI / 180);
        ctx.stroke();
    });

    Object.keys(data).forEach(coordStr => {
        const state = data[coordStr];
        const [ix, iy] = coordStr.split(',').map(Number);

        if (state === 1) {
            ctx.beginPath();
            ctx.arc(ix * scale, iy * scale, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();

            const crossHalfLength = 0.25 * scale;
            ctx.strokeStyle = crossProps.color;
            ctx.lineWidth = crossProps.lw;
            ctx.beginPath();
            ctx.moveTo((ix * scale) - crossHalfLength, (iy * scale) - crossHalfLength);
            ctx.lineTo((ix * scale) + crossHalfLength, (iy * scale) + crossHalfLength);
            ctx.moveTo((ix * scale) + crossHalfLength, (iy * scale) - crossHalfLength);
            ctx.lineTo((ix * scale) - crossHalfLength, (iy * scale) + crossHalfLength);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(ix * scale, iy * scale, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = arcProps.color;
            ctx.lineWidth = arcProps.lw;
            const radius = 0.35 * scale;

            if (yellowStyleCoords.has(coordStr)) {
                ctx.beginPath();
                ctx.ellipse(ix * scale, (iy - 0.5) * scale, radius, radius, 180 * Math.PI / 180, 225 * Math.PI / 180, 315 * Math.PI / 180);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(ix * scale, (iy + 0.5) * scale, radius, radius, 180 * Math.PI / 180, 45 * Math.PI / 180, 135 * Math.PI / 180);
                ctx.stroke();
            } else if (greenStyleCoords.has(coordStr)) {
                ctx.beginPath();
                ctx.ellipse((ix - 0.5) * scale, iy * scale, radius, radius, 0, 315 * Math.PI / 180, 405 * Math.PI / 180);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse((ix + 0.5) * scale, iy * scale, radius, radius, 0, 135 * Math.PI / 180, 225 * Math.PI / 180);
                ctx.stroke();
            }
        }
    });
    ctx.restore();
  };

  const drawKolam171 = (canvas: HTMLCanvasElement, data: IntersectionData) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 60;
    const canvasSize = 7 * scale;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(scale / 2, scale / 2);

    const arcProps = { color: 'black', lw: 2.0 };
    const crossProps = { color: 'black', lw: 2.0 };
    
    const outerArcsParams = [
        { center: [3, 0], w: 0.7, h: 0.7, angle: 0, t1: 135, t2: 405 },
        { center: [2, 1], w: 0.7, h: 0.7, angle: -45, t1: 180, t2: 360 },
        { center: [4, 1], w: 0.7, h: 0.7, angle: 45, t1: 180, t2: 360 },
        { center: [1, 2], w: 0.7, h: 0.7, angle: -45, t1: 180, t2: 360 },
        { center: [5, 2], w: 0.7, h: 0.7, angle: 45, t1: 180, t2: 360 },
        { center: [0, 3], w: 0.7, h: 0.7, angle: 0, t1: 45, t2: 315 },
        { center: [6, 3], w: 0.7, h: 0.7, angle: 0, t1: -135, t2: 135 },
        { center: [1, 4], w: 0.7, h: 0.7, angle: 45, t1: 0, t2: 180 },
        { center: [5, 4], w: 0.7, h: 0.7, angle: -45, t1: 0, t2: 180 },
        { center: [2, 5], w: 0.7, h: 0.7, angle: 45, t1: 0, t2: 180 },
        { center: [4, 5], w: 0.7, h: 0.7, angle: -45, t1: 0, t2: 180 },
        { center: [3, 6], w: 0.7, h: 0.7, angle: 0, t1: -45, t2: 225 },
    ];

    const pulliDots: [number, number][] = [];
    for (let r = 0; r < 7; r++) {
      const numDots = 7 - 2 * Math.abs(r - 3);
      const startX = Math.abs(r - 3);
      for (let i = 0; i < numDots; i++) {
        const c = startX + i;
        pulliDots.push([c, r]);
      }
    }

    const yellowStyleCoords = new Set([
        '3,0.5', '2,1.5', '3,1.5', '4,1.5', '1,2.5', '2,2.5', '3,2.5', '4,2.5', '5,2.5',
        '1,3.5', '2,3.5', '3,3.5', '4,3.5', '5,3.5', '2,4.5', '3,4.5', '4,4.5', '3,5.5'
    ]);
    const greenStyleCoords = new Set([
        '2.5,1', '3.5,1', '1.5,2', '2.5,2', '3.5,2', '4.5,2', '0.5,3', '1.5,3', '2.5,3',
        '3.5,3', '4.5,3', '5.5,3', '1.5,4', '2.5,4', '3.5,4', '4.5,4', '2.5,5', '3.5,5'
    ]);

    pulliDots.forEach(([c, r]) => {
        ctx.beginPath();
        ctx.arc(c * scale, r * scale, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
    });

    outerArcsParams.forEach(p => {
        ctx.strokeStyle = arcProps.color;
        ctx.lineWidth = arcProps.lw;
        ctx.beginPath();
        const radius = (p.w / 2) * scale;
        ctx.ellipse(p.center[0] * scale, p.center[1] * scale, radius, radius, p.angle * Math.PI / 180, p.t1 * Math.PI / 180, p.t2 * Math.PI / 180);
        ctx.stroke();
    });

    Object.keys(data).forEach(coordStr => {
        const state = data[coordStr];
        const [ix, iy] = coordStr.split(',').map(Number);

        if (state === 1) {
            ctx.beginPath();
            ctx.arc(ix * scale, iy * scale, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'black';
            ctx.fill();

            const crossHalfLength = 0.25 * scale;
            ctx.strokeStyle = crossProps.color;
            ctx.lineWidth = crossProps.lw;
            ctx.beginPath();
            ctx.moveTo((ix * scale) - crossHalfLength, (iy * scale) - crossHalfLength);
            ctx.lineTo((ix * scale) + crossHalfLength, (iy * scale) + crossHalfLength);
            ctx.moveTo((ix * scale) + crossHalfLength, (iy * scale) - crossHalfLength);
            ctx.lineTo((ix * scale) - crossHalfLength, (iy * scale) + crossHalfLength);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(ix * scale, iy * scale, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = arcProps.color;
            ctx.lineWidth = arcProps.lw;
            const radius = 0.35 * scale;

            if (yellowStyleCoords.has(coordStr)) {
                ctx.beginPath();
                ctx.ellipse(ix * scale, (iy - 0.5) * scale, radius, radius, 180 * Math.PI / 180, 225 * Math.PI / 180, 315 * Math.PI / 180);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse(ix * scale, (iy + 0.5) * scale, radius, radius, 180 * Math.PI / 180, 45 * Math.PI / 180, 135 * Math.PI / 180);
                ctx.stroke();
            } else if (greenStyleCoords.has(coordStr)) {
                ctx.beginPath();
                ctx.ellipse((ix - 0.5) * scale, iy * scale, radius, radius, 0, 315 * Math.PI / 180, 405 * Math.PI / 180);
                ctx.stroke();
                ctx.beginPath();
                ctx.ellipse((ix + 0.5) * scale, iy * scale, radius, radius, 0, 135 * Math.PI / 180, 225 * Math.PI / 180);
                ctx.stroke();
            }
        }
    });
    ctx.restore();
  };

  const handleHexCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (/^[0-9A-F]*$/.test(value) && value.length <= 4) {
      setHexCode(value);
    }
  };

  const handleHexCodeChange171 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    if (/^[0-9A-F]*$/.test(value) && value.length <= 9) {
      setHexCode171(value);
    }
  };

  const handleGenerate = () => {
    const data = getIntersectionData(hexCode);
    if (data && canvasRef.current) {
        drawKolam(canvasRef.current, data);
    }
  };

  const handleGenerate171 = () => {
    const paddedHexCode = hexCode171.padEnd(9, '0');
    const data = getIntersectionData171(paddedHexCode);
    if (data && canvasRef171.current) {
        drawKolam171(canvasRef171.current, data);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 py-8 sm:py-12 md:py-20 flex flex-col">
      {/* Header Title */}
      <div className="text-center mb-8 sm:mb-16 max-w-3xl mx-auto relative flex flex-col items-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold font-serif text-amber-950 mb-4 sm:mb-6 drop-shadow-sm">
          Design a Kolam
        </h1>
        <p className="text-base sm:text-xl text-amber-800/80 font-medium mb-4 sm:mb-6">
          Create your own geometric patterns using structural hex codes and witness the beauty unfolds.
        </p>
        <button 
          onClick={() => setShowHelp(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-full font-bold transition-all shadow-sm border border-amber-300 hover:shadow-md"
        >
          <HelpCircle size={18} /> How does this work?
        </button>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-amber-950/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border border-amber-200 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowHelp(false)} className="absolute top-3 right-3 sm:top-4 sm:right-4 text-amber-400 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full p-1 transition-colors z-10">
              <X size={20} />
            </button>
            <h3 className="text-xl sm:text-3xl font-bold font-serif text-amber-950 mb-3 sm:mb-4 pr-10">How Kolam Hex Codes Work</h3>
            <div className="space-y-3 sm:space-y-4 text-amber-900 border-t border-amber-100 pt-3 sm:pt-4 leading-relaxed text-sm sm:text-base">
              <p>This designer uses hexadecimal characters to program the geometry of intersections between the dots.</p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 marker:text-amber-500">
                <li><strong>1-5-1 Kolam (Small):</strong> Max <strong>4-character</strong> hex code (e.g., <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-800 text-xs sm:text-sm">F0F0</code>). 4 diamond sections.</li>
                <li><strong>1-7-1 Kolam (Large):</strong> Max <strong>9-character</strong> hex code (e.g., <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-800 text-xs sm:text-sm">A5A5A5A5A</code>). 9 diamond sections.</li>
              </ul>
              <p>Each hex character (<code className="text-xs">0-F</code>) converts to 4 binary bits. Each bit controls one intersection (Top, Right, Left, Bottom):</p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 marker:text-amber-500">
                <li><code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-800 text-xs sm:text-sm">1</code> : Straight cross connection.</li>
                <li><code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-800 text-xs sm:text-sm">0</code> : Continuous curving loop.</li>
              </ul>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-3 sm:p-5 rounded-xl border border-amber-200 mt-4 sm:mt-6 shadow-inner">
                <strong className="block mb-1 sm:mb-2 text-amber-950 text-sm sm:text-base">💡 Pro Tips:</strong> 
                <span className="text-amber-800 text-xs sm:text-sm">Use all zeros for a purely curved Kolam, or all <code className="font-bold">F</code>s for a sharp diagonal structure.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-center items-stretch gap-6 sm:gap-10 w-full max-w-7xl mx-auto flex-grow">
        {/* 1-5-1 Kolam Designer */}
        <div className="flex-1 flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-900/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-amber-950 font-serif">1-5-1 Kolam</h2>
          <div className="flex flex-col items-center w-full max-w-xs gap-4">
            <input
              type="text"
              value={hexCode}
              onChange={handleHexCodeChange}
              maxLength={4}
              className="w-full p-3 text-amber-900 bg-amber-50/50 border-2 border-amber-200 font-mono text-xl text-center rounded-xl focus:border-amber-500 focus:ring-0 focus:outline-none transition-colors"
              placeholder="0000"
            />
            <button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Generate Pattern
            </button>
          </div>
          <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 shadow-inner w-full flex justify-center items-center aspect-square">
            <canvas ref={canvasRef} className="rounded-xl w-full h-full object-contain" />
          </div>
        </div>

        {/* 1-7-1 Kolam Designer */}
        <div className="flex-1 flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-8 bg-white rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-amber-900/10">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-amber-950 font-serif">1-7-1 Kolam</h2>
          <div className="flex flex-col items-center w-full max-w-xs gap-4">
            <input
              type="text"
              value={hexCode171}
              onChange={handleHexCodeChange171}
              maxLength={9}
              className="w-full p-3 text-amber-900 bg-amber-50/50 border-2 border-amber-200 font-mono text-xl text-center rounded-xl focus:border-amber-500 focus:ring-0 focus:outline-none transition-colors"
              placeholder="000000000"
            />
            <button
              onClick={handleGenerate171}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Generate Pattern
            </button>
          </div>
          <div className="mt-4 bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-2xl border border-amber-100 shadow-inner w-full flex justify-center items-center aspect-square">
            <canvas ref={canvasRef171} className="rounded-xl w-full h-full object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default KolamDesigner;
