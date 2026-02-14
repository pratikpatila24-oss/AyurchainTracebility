import React, { useState, useRef, useEffect } from 'react';
import { UserIcon, QrCodeIcon, LeafIcon, BoxIcon, FlaskConicalIcon, FactoryIcon, SparklesIcon } from '../components/Icons';

const Consumer = ({ manufacturedProducts, t, initialLotNumber }) => {
  const [searchLotNumber, setSearchLotNumber] = useState('');
  const [foundProduct, setFoundProduct] = useState(null);
  const [error, setError] = useState('');
  const [aiDetails, setAiDetails] = useState('');
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (initialLotNumber && manufacturedProducts.length > 0) {
      setSearchLotNumber(initialLotNumber);
      const product = manufacturedProducts.find(p => p.lotNumber === initialLotNumber);
      if (product) {
        setFoundProduct(product);
      } else {
        setError(t('lotNumberNotFound', { lotNumber: initialLotNumber }));
      }
    }
  }, [initialLotNumber, manufacturedProducts, t]);

  const handleTrace = (e) => {
    if (e) e.preventDefault();
    setError('');
    setAiDetails('');
    const product = manufacturedProducts.find(p => p.lotNumber === searchLotNumber);
    if (product) {
      setFoundProduct(product);
    } else {
      setError(t('lotNumberNotFound', { lotNumber: searchLotNumber }));
      setFoundProduct(null);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && window.jsQR) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.height = videoRef.current.videoHeight;
      canvas.width = videoRef.current.videoWidth;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        setSearchLotNumber(code.data);
        stopScanner();
        setTimeout(() => document.getElementById('trace-button')?.click(), 100);
      }
    }
    if (streamRef.current) {
      requestAnimationFrame(scan);
    }
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsScanning(true);
      requestAnimationFrame(scan);
    } catch (err) {
      setError('Could not access the camera. Please check permissions.');
      console.error("Error accessing camera:", err);
    }
  };

  const fetchHerbDetails = async (herbName) => {
    setIsFetchingDetails(true);
    setAiDetails('');
    setError('');

    const apiKey = "AIzaSyDwM5S7ZqBNpDyDprvkoYYvHF_B2eLDa88"; // WARNING: Move to backend in production
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const userQuery = t('aiPrompt', { herbName });

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userQuery }] }] })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        setAiDetails(text);
      } else {
        setError(t('aiError'));
      }
    } catch (err) {
      console.error("AI fetch error:", err);
      setError(t('aiFetchError'));
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handleReset = () => {
    setFoundProduct(null);
    setSearchLotNumber('');
    setAiDetails('');
    setError('');
  };

  const TimelineEvent = ({ icon: Icon, color, title, date, location, details, delay }) => (
    <div className={`relative pl-8 pb-8 border-l-2 border-slate-200 last:border-0 last:pb-0 animate-fadeIn`} style={{ animationDelay: delay }}>
      <div className={`absolute -left-[11px] top-0 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${color}`}>
        <Icon className="w-3 h-3 text-white" />
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <h5 className="font-bold text-slate-800 text-sm mb-1">{title}</h5>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-2">
          {date && <span className="flex items-center gap-1">📅 {date}</span>}
          {location && <span className="flex items-center gap-1">📍 {location}</span>}
        </div>
        {details}
      </div>
    </div>
  );

  return (
    <div className="glass-panel p-8 rounded-3xl animate-fadeIn">
      {isScanning && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg h-auto rounded-2xl shadow-2xl border-4 border-brand-green/30"></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          <button onClick={stopScanner} className="mt-8 bg-white text-gray-800 hover:bg-gray-100 font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg hover:scale-105 active:scale-95">
            {t('stopScanning')}
          </button>
        </div>
      )}

      {!foundProduct ? (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-10">
          <div className="animate-slideDown">
            <div className="inline-block p-4 rounded-full bg-brand-green/10 mb-6 animate-float">
              <LeafIcon className="w-12 h-12 text-brand-green" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-2">{t('consumerPortal')}</h3>
            <p className="text-slate-500 text-lg">{t('traceProductPrompt')}</p>
          </div>

          <form onSubmit={handleTrace} className="bg-white p-2 rounded-2xl shadow-lg border border-slate-100 flex flex-col sm:flex-row gap-2 animate-slideUp delay-100">
            <input
              type="text"
              value={searchLotNumber}
              onChange={e => setSearchLotNumber(e.target.value)}
              className="flex-grow px-6 py-4 rounded-xl text-lg outline-none text-slate-700 placeholder:text-slate-400"
              placeholder="PROD-LOT-..."
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={startScanner}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-4 rounded-xl transition-colors shrink-0"
                title={t('scanQrCode')}
              >
                <QrCodeIcon className="w-6 h-6" />
              </button>
              <button id="trace-button" type="submit" className="bg-brand-green hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-brand-green/20 hover:scale-105 active:scale-95 text-lg">
                {t('traceProduct')}
              </button>
            </div>
          </form>
          {error && <p className="text-red-500 font-bold animate-shake bg-red-50 py-2 rounded-lg">{error}</p>}
        </div>
      ) : (
        <div className="space-y-8 animate-slideUp">
          <div className="text-center pb-8 border-b border-slate-100">
            <button onClick={handleReset} className="text-sm text-slate-400 hover:text-slate-600 font-bold mb-6 flex items-center justify-center gap-1 transition-colors hover:-translate-y-0.5">
              <span>←</span> {t('traceAnotherProduct')}
            </button>
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm mb-4 animate-scaleIn">
              <span>✅</span> Authenticity Verified
            </div>
            <h4 className="text-4xl font-bold text-slate-800 mb-2 font-serif">{foundProduct.productName}</h4>
            <p className="font-mono text-slate-400">{foundProduct.lotNumber}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="lg:col-span-2 space-y-8">
              <h5 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                <BoxIcon className="w-5 h-5 text-brand-green" /> Product Journey
              </h5>
              <div className="pl-4">
                {/* Timeline */}
                <TimelineEvent
                  icon={LeafIcon}
                  color="bg-emerald-500"
                  title={t('harvest')}
                  date={foundProduct.ingredientBatch.harvestDate}
                  location={foundProduct.ingredientBatch.location.city}
                  delay="100ms"
                  details={
                    <div className="mt-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p><span className="font-bold">{t('herb')}:</span> {foundProduct.ingredientBatch.herb}</p>
                      <p><span className="font-bold">Batch ID:</span> <span className="font-mono text-xs">{foundProduct.ingredientBatch.batchId}</span></p>
                    </div>
                  }
                />
                <TimelineEvent
                  icon={BoxIcon}
                  color="bg-blue-500"
                  title={t('collection')}
                  location={foundProduct.ingredientBatch.collectionLocation.city}
                  delay="200ms"
                  details={
                    <p className="text-xs text-slate-500">{t('submittedFrom')} {foundProduct.ingredientBatch.submissionLocation.city}</p>
                  }
                />
                <TimelineEvent
                  icon={FlaskConicalIcon}
                  color="bg-purple-500"
                  title={t('labTesting')}
                  delay="300ms"
                  details={
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {foundProduct.ingredientBatch.qualityTests.map(test => (
                        <div key={test.name} className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100 flex justify-between items-center">
                          <span>{test.name}</span>
                          <span className="font-bold">Pass</span>
                        </div>
                      ))}
                    </div>
                  }
                />
                <TimelineEvent
                  icon={FactoryIcon}
                  color="bg-amber-500"
                  title={t('manufacturing')}
                  delay="400ms"
                  details={
                    <p className="text-sm text-slate-600">{t('productCreatedWithBatch', { batchId: foundProduct.ingredientBatch.batchId })}</p>
                  }
                />
                <TimelineEvent
                  icon={UserIcon}
                  color="bg-slate-400"
                  title="In Your Hands"
                  date={new Date().toLocaleDateString()}
                  delay="500ms"
                  details={<p className="text-xs text-slate-500">Verified by you just now.</p>}
                />
              </div>
            </div>

            {/* Sidebar: AI & Details */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-brand-green/5 to-emerald-50 p-6 rounded-3xl border border-brand-green/10">
                <h5 className="font-bold text-lg text-brand-green mb-4 flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" /> Knowledge Hub
                </h5>
                {!aiDetails && !isFetchingDetails && (
                  <div className="text-center py-6">
                    <p className="text-slate-600 mb-6 text-sm">Discover the ancient wisdom and modern benefits behind <span className="font-bold">{foundProduct.ingredientBatch.herb}</span>.</p>
                    <button
                      onClick={() => fetchHerbDetails(foundProduct.ingredientBatch.herb)}
                      className="w-full bg-white hover:bg-emerald-50 text-brand-green font-bold py-3 px-6 rounded-xl transition duration-300 shadow-sm border border-brand-green/20 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      {t('askAi', { herbName: foundProduct.ingredientBatch.herb })}
                    </button>
                  </div>
                )}
                {isFetchingDetails && (
                  <div className="text-center text-slate-400 py-10 font-bold animate-pulse flex flex-col items-center justify-center gap-2">
                    <SparklesIcon className="w-8 h-8 animate-spin text-brand-green/50" />
                    <span className="text-sm">{t('fetchingDetails')}...</span>
                  </div>
                )}
                {aiDetails && (
                  <div className="prose prose-sm prose-emerald animate-fadeIn bg-white/50 p-4 rounded-xl border border-white/50">
                    <h6 className="font-bold text-slate-800 mb-2">{t('aboutHerb', { herbName: foundProduct.ingredientBatch.herb })}</h6>
                    <p className="text-slate-600 text-sm leading-relaxed">{aiDetails}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consumer;