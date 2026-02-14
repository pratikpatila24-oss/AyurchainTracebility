import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CameraIcon, LeafIcon, ChartBarIcon, CalendarIcon, CopyIcon } from '../components/Icons';

const Farmer = ({ harvestHistory, addHarvestToHistory, t }) => {
  const [herb, setHerb] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [stream, setStream] = useState(null);
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(''); // State to track which ID was copied
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stats Calculation
  const stats = useMemo(() => {
    const totalHarvests = harvestHistory.length;
    const totalWeight = harvestHistory.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);
    return { totalHarvests, totalWeight: totalWeight.toFixed(1) };
  }, [harvestHistory]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(text);
      setTimeout(() => setCopiedId(''), 2000); // Reset after 2 seconds
    });
  };

  const fetchCityName = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: {
          'User-Agent': 'Botanical Traceability POC/1.0',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown Area';
        setLocation(prevLocation => ({ ...prevLocation, city }));
      } else {
        setLocation(prevLocation => ({ ...prevLocation, city: 'City not found' }));
      }
    } catch (err) {
      console.error("Error fetching city name:", err);
      setLocation(prevLocation => ({ ...prevLocation, city: 'Failed to contact service' }));
    }
  };

  const handleCapture = () => {
    setError('');
    setLocationError('');
    setIsCapturingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(5);
          const lon = position.coords.longitude.toFixed(5);
          setLocation({
            lat: lat,
            lon: lon,
            city: 'Fetching city...',
          });
          fetchCityName(lat, lon);
          openCamera();
          setIsCapturingLocation(false);
        },
        (err) => {
          setLocationError(`Geolocation failed: ${err.message}`);
          setIsCapturingLocation(false);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      setIsCapturingLocation(false);
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      setError('Could not access the camera. Please check permissions.');
      console.error("Error accessing camera:", err);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
    setStream(null);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setPhoto(dataUrl);
      closeCamera();
    }
  };

  const generateBatchId = (e) => {
    e.preventDefault();
    setError('');
    if (herb && harvestDate && weight && quantity && location && photo) {
      setBatchId(`FARM-BATCH-${Date.now().toString().slice(-6)}`);
    } else {
      setError(t('fillAllFieldsError'));
    }
  };

  const resetForm = () => {
    setHerb('');
    setHarvestDate('');
    setWeight('');
    setQuantity('');
    setLocation(null);
    setLocationError('');
    setPhoto(null);
    setBatchId('');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (batchId) {
      const newHarvest = {
        herb,
        harvestDate,
        weight,
        quantity,
        location,
        photo,
        batchId
      };
      addHarvestToHistory(newHarvest);
      resetForm();
    } else {
      setError(t('generateBatchIdError'));
    }
  }

  const handleInputChange = (setter, isNumeric = false) => (e) => {
    setError('');
    const { value } = e.target;
    if (isNumeric) {
      if (value === '' || Number(value) >= 0) {
        setter(value);
      }
    } else {
      setter(value);
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <LeafIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t('totalHarvests')}</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalHarvests}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t('totalYield')}</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalWeight} <span className="text-sm font-medium text-slate-500">kg</span></p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Date</p>
            <p className="text-xl font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <LeafIcon className="w-64 h-64 text-emerald-900" />
            </div>

            {isCameraOpen && (
              <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                <video ref={videoRef} autoPlay playsInline className="w-full max-w-3xl h-auto rounded-2xl shadow-2xl border-4 border-emerald-500/30"></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div className="mt-8 flex gap-6">
                  <button type="button" onClick={takePhoto} className="glass-button py-3 px-8 rounded-full font-bold flex items-center gap-2 text-lg">
                    <CameraIcon />
                    <span>Take Photo</span>
                  </button>
                  <button type="button" onClick={closeCamera} className="bg-white text-slate-700 hover:bg-slate-100 font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg hover:scale-105 active:scale-95">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3 border-b border-brand-green/10 pb-4 relative z-10">
              <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 animate-float"><LeafIcon className="w-6 h-6" /></div>
              {t('logNewHarvest')}
            </h3>

            <form className="space-y-8 relative z-10" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="herb" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('herb')}</label>
                  <input type="text" id="herb" value={herb} onChange={handleInputChange(setHerb)} disabled={!!batchId} className="input-modern w-full px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80" placeholder="e.g., Ashwagandha" />
                </div>
                <div>
                  <label htmlFor="harvestDate" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('harvestDate')}</label>
                  <input type="date" id="harvestDate" value={harvestDate} onChange={handleInputChange(setHarvestDate)} disabled={!!batchId} className="input-modern w-full px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80" />
                </div>
                <div>
                  <label htmlFor="weight" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('weightKg')}</label>
                  <input type="number" id="weight" value={weight} min="0" onChange={handleInputChange(setWeight, true)} disabled={!!batchId} className="input-modern w-full px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80" placeholder="e.g., 50.5" />
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('quantity')}</label>
                  <input type="number" id="quantity" value={quantity} min="0" onChange={handleInputChange(setQuantity, true)} disabled={!!batchId} className="input-modern w-full px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed bg-white/80" placeholder="e.g., 120 units" />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-4">
                <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                  <span className="bg-emerald-500 text-white p-1 rounded-full animate-pulse-soft"><CameraIcon className="w-4 h-4" /></span>
                  {t('geotaggingAndPhoto')}
                </h4>
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <button type="button" onClick={handleCapture} disabled={!!batchId || isCapturingLocation} className="w-full md:w-auto flex-shrink-0 bg-white hover:bg-emerald-50 text-emerald-600 border-2 border-emerald-500 font-bold py-3 px-6 rounded-xl transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95">
                    <CameraIcon />
                    {isCapturingLocation ? t('gettingLocation') : t('captureLocationAndPhoto')}
                  </button>
                  <div className="flex-grow text-center md:text-left bg-white/80 px-4 py-3 rounded-xl border border-slate-200 shadow-sm w-full transition-all duration-300 hover:shadow-md">
                    {location ? (
                      <p className="text-sm text-slate-700 font-medium flex items-center gap-2 justify-center md:justify-start animate-fadeIn">
                        <span className="text-emerald-500">📍</span> {location.city} <span className="text-slate-400 text-xs ml-2">({location.lat}, {location.lon})</span>
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">{locationError || t('locationNotCaptured')}</p>
                    )}
                  </div>
                </div>
                {photo && (
                  <div className="mt-4 bg-white p-2 rounded-xl border border-slate-200 shadow-md inline-block animate-scaleIn">
                    <img src={photo} alt="Captured herb" className="rounded-lg w-full max-w-xs mx-auto" />
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">
                {!batchId ? (
                  <button type="button" onClick={generateBatchId} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-6 rounded-xl transition duration-300 shadow-lg shadow-amber-500/20 transform hover:-translate-y-1 active:scale-95">
                    {t('generateBatchId')}
                  </button>
                ) : (
                  <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 text-center shadow-lg animate-scaleIn relative group">
                    <label htmlFor="batchId" className="block text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">{t('generatedBatchId')}</label>
                    <div className="flex items-center justify-center gap-2">
                      <input type="text" id="batchId" readOnly value={batchId} className="w-full bg-transparent border-none text-3xl font-mono font-bold text-slate-800 text-center focus:ring-0 p-0" />
                      <button type="button" onClick={() => copyToClipboard(batchId)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Copy Batch ID">
                        {copiedId === batchId ? <span className="text-xs font-bold">Copied!</span> : <CopyIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}
                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">{error}</p>}
              </div>

              <button type="submit" disabled={!batchId} className="glass-button w-full font-bold py-4 px-6 rounded-xl disabled:bg-slate-300 disabled:text-slate-500 disabled:from-slate-300 disabled:to-slate-300 disabled:transform-none disabled:cursor-not-allowed disabled:shadow-none bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 shadow-emerald-500/30">
                {t('logNewHarvest')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl bg-slate-50/50 sticky top-24">
            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <LeafIcon className="w-5 h-5 text-emerald-500" />
              {t('harvestHistory')}
            </h4>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
              {harvestHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>{t('noHarvestsYet')}</p>
                </div>
              ) : (
                harvestHistory.map((harvest, index) => (
                  <div key={harvest.batchId} style={{ animationDelay: `${index * 50}ms` }} className={`bg-white p-4 rounded-xl border ${harvest.labFeedback ? 'border-red-200 bg-red-50/30' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 group animate-slideUp`}>
                    <div className="flex items-center gap-4">
                      <img src={harvest.photo} alt={harvest.herb} className="w-16 h-16 object-cover rounded-lg shadow-sm" />
                      <div className="flex-grow">
                        <h5 className="font-bold text-slate-800">{harvest.herb}</h5>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{harvest.batchId}</span>
                          <button type="button" onClick={() => copyToClipboard(harvest.batchId)} className="text-slate-400 hover:text-emerald-600 transition-colors" title="Copy Batch ID">
                            {copiedId === harvest.batchId ? <span className="text-[10px] font-bold text-emerald-600">✓</span> : <CopyIcon className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">
                      <p><strong className="text-slate-400">{t('date')}:</strong><br />{harvest.harvestDate}</p>
                      <p><strong className="text-slate-400">{t('weight')}:</strong><br />{harvest.weight} kg</p>
                    </div>

                    {harvest.labFeedback && (
                      <div className="pt-2 border-t border-red-100">
                        <p className="text-red-600 text-xs font-bold flex items-center gap-1"><span className="text-sm">⚠️</span> {t('labTestingFail')}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Farmer;