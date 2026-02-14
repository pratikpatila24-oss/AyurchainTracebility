import React, { useState, useRef, useEffect, useMemo } from 'react';
import { BoxIcon, LeafIcon, CameraIcon, ChartBarIcon, CalendarIcon, CopyIcon } from '../components/Icons';

const Collector = ({ harvestHistory, collectedBatches = [], addCollectedBatch, t }) => {
    const [searchBatchId, setSearchBatchId] = useState('');
    const [foundBatch, setFoundBatch] = useState(null);
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [collectionLocation, setCollectionLocation] = useState(null);
    const [collectionPhoto, setCollectionPhoto] = useState(null);
    const [submissionLocation, setSubmissionLocation] = useState(null);
    const [submissionPhoto, setSubmissionPhoto] = useState(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [stream, setStream] = useState(null);
    const [captureMode, setCaptureMode] = useState(null);
    const [copiedId, setCopiedId] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Stats
    const stats = useMemo(() => {
        const totalCollected = collectedBatches.length;
        const totalWeight = collectedBatches.reduce((acc, curr) => acc + (parseFloat(curr.weight) || 0), 0);
        return { totalCollected, totalWeight: totalWeight.toFixed(1) };
    }, [collectedBatches]);

    useEffect(() => {
        if (isCameraOpen && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [isCameraOpen, stream]);

    // Copy to clipboard helper
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(text);
            setTimeout(() => setCopiedId(''), 2000);
        });
    };

    const fetchCityName = async (lat, lon, locationSetter) => {
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
                locationSetter(prevLocation => ({ ...prevLocation, city }));
            } else {
                locationSetter(prevLocation => ({ ...prevLocation, city: 'City not found' }));
            }
        } catch (err) {
            console.error("Error fetching city name:", err);
            locationSetter(prevLocation => ({ ...prevLocation, city: 'Failed to contact service' }));
        }
    };

    const openCamera = async (mode) => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            setStream(mediaStream);
            setCaptureMode(mode);
            setIsCameraOpen(true);
        } catch (err) {
            setError('Could not access the camera. Please check permissions.');
        }
    };

    const closeCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraOpen(false);
        setStream(null);
        setCaptureMode(null);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');

            if (captureMode === 'collection') {
                setCollectionPhoto(dataUrl);
            } else if (captureMode === 'submission') {
                setSubmissionPhoto(dataUrl);
            }
            closeCamera();
        }
    };

    const handleFindBatch = (e) => {
        e.preventDefault();
        setError('');
        const batch = harvestHistory.find(h => h.batchId === searchBatchId);
        if (batch) {
            setFoundBatch(batch);
        } else {
            setError(t('batchIdNotFound', { batchId: searchBatchId }));
            setFoundBatch(null);
        }
    };

    const handleCaptureCollection = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(5);
                    const lon = position.coords.longitude.toFixed(5);
                    setCollectionLocation({ lat, lon, city: 'Fetching city...' });
                    fetchCityName(lat, lon, setCollectionLocation);
                    openCamera('collection');
                },
                (err) => {
                    setError(`Geolocation failed: ${err.message}`);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }

    const handleCaptureSubmission = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(5);
                    const lon = position.coords.longitude.toFixed(5);
                    setSubmissionLocation({ lat, lon, city: 'Fetching city...' });
                    fetchCityName(lat, lon, setSubmissionLocation);
                    openCamera('submission');
                },
                (err) => {
                    setError(`Geolocation failed: ${err.message}`);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }

    const handleSubmitToLab = () => {
        const collectedBatchData = {
            ...foundBatch,
            collectionLocation,
            collectionPhoto,
            submissionLocation,
            submissionPhoto
        };
        addCollectedBatch(collectedBatchData);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="bg-emerald-50 p-10 rounded-3xl shadow-lg border-2 border-emerald-100 text-center max-w-2xl mx-auto animate-scaleIn my-10">
                <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-pulse-soft">
                    <span className="text-4xl animate-float">🎉</span>
                </div>
                <h3 className="text-3xl font-bold text-emerald-800 mb-4">{t('batchSubmittedToLab')}</h3>
                <p className="text-emerald-700 mb-8 text-lg font-medium">{t('batchIsReadyForTesting', { batchId: foundBatch.batchId })}</p>
                <button onClick={() => { setSearchBatchId(''); setFoundBatch(null); setIsSubmitted(false); setCollectionPhoto(null); setSubmissionPhoto(null); setCollectionLocation(null); setSubmissionLocation(null); }} className="glass-button font-bold py-3 px-8 rounded-full shadow-lg transform hover:-translate-y-1 hover:scale-105 active:scale-95">
                    {t('processAnotherBatch')}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <BoxIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Batches Collected</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalCollected}</p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t('totalWeight')}</p>
                        <p className="text-3xl font-bold text-slate-800">{stats.totalWeight} <span className="text-sm font-medium text-slate-500">kg</span></p>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100/50 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Date</p>
                        <p className="text-xl font-bold text-slate-800">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </div>


            {isCameraOpen && (
                <div className="fixed inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn">
                    <video ref={videoRef} autoPlay playsInline className="w-full max-w-3xl h-auto rounded-2xl shadow-2xl border-4 border-blue-500/30"></video>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    <div className="mt-8 flex gap-6">
                        <button type="button" onClick={takePhoto} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 flex items-center gap-2 text-lg shadow-lg transform hover:-translate-y-1 active:scale-95">Take Photo</button>
                        <button type="button" onClick={closeCamera} className="bg-white text-slate-700 hover:bg-slate-100 font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg active:scale-95">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Action Area */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel p-8 rounded-3xl animate-fadeIn relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <BoxIcon className="w-64 h-64 text-blue-900" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3 border-b border-brand-green/10 pb-4 relative z-10">
                            <div className="bg-blue-100 p-2 rounded-xl text-blue-600 animate-float"><BoxIcon className="w-6 h-6" /></div>
                            {t('collectorDashboard')}
                        </h3>

                        {!foundBatch ? (
                            <form onSubmit={handleFindBatch} className="space-y-6 max-w-lg mx-auto bg-white/80 p-8 rounded-3xl shadow-sm border border-slate-100 animate-slideUp relative z-10">
                                <div>
                                    <label htmlFor="searchBatchId" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('enterFarmerBatchId')}</label>
                                    <div className="flex gap-3">
                                        <input type="text" id="searchBatchId" value={searchBatchId} onChange={e => setSearchBatchId(e.target.value)} className="input-modern w-full px-4 py-3" placeholder="FARM-BATCH-..." />
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg shadow-blue-500/20 whitespace-nowrap hover:scale-105 active:scale-95">{t('find')}</button>
                                    </div>
                                </div>
                                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">{error}</p>}
                            </form>
                        ) : (
                            <div className="space-y-8 animate-slideUp relative z-10">
                                <div>
                                    <button onClick={() => setFoundBatch(null)} className="text-sm text-blue-600 hover:text-blue-800 font-bold mb-6 flex items-center gap-1 transition-colors hover:-translate-x-1 duration-200">
                                        <span className="text-lg">←</span> {t('searchAnotherBatch')}
                                    </button>
                                    <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 animate-fadeIn delay-100">
                                        <h4 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                                            <LeafIcon className="w-5 h-5" />
                                            {t('farmerDataFor')} <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 ml-2">{foundBatch.batchId}</span>
                                            <button type="button" onClick={() => copyToClipboard(foundBatch.batchId)} className="text-emerald-600 hover:text-emerald-800 transition-colors" title="Copy Batch ID">
                                                {copiedId === foundBatch.batchId ? <span className="text-xs font-bold">Copied!</span> : <CopyIcon className="w-4 h-4" />}
                                            </button>
                                        </h4>
                                        <div className="flex flex-col sm:flex-row items-center gap-6">
                                            <img src={foundBatch.photo} alt={foundBatch.herb} className="w-32 h-32 object-cover rounded-xl shadow-md border-2 border-white transition-transform hover:scale-105 duration-300" />
                                            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm flex-grow">
                                                <p className="border-b border-slate-200 pb-2"><strong className="text-slate-400 block text-xs uppercase tracking-wide">{t('herb')}</strong> <span className="text-lg font-semibold text-slate-800">{foundBatch.herb}</span></p>
                                                <p className="border-b border-slate-200 pb-2"><strong className="text-slate-400 block text-xs uppercase tracking-wide">{t('harvestDate')}</strong> <span className="text-lg font-semibold text-slate-800">{foundBatch.harvestDate}</span></p>
                                                <p className="border-b border-slate-200 pb-2"><strong className="text-slate-400 block text-xs uppercase tracking-wide">{t('weightKg')}</strong> <span className="text-lg font-semibold text-slate-800">{foundBatch.weight} kg</span></p>
                                                <p className="border-b border-slate-200 pb-2"><strong className="text-slate-400 block text-xs uppercase tracking-wide">{t('quantity')}</strong> <span className="text-lg font-semibold text-slate-800">{foundBatch.quantity}</span></p>
                                                <p className="col-span-2 pt-2"><strong className="text-slate-400 block text-xs uppercase tracking-wide">{t('location')}</strong> <span className="text-base font-medium text-slate-700">{foundBatch.location.city} <span className="text-slate-400 text-xs">({foundBatch.location.lat}, {foundBatch.location.lon})</span></span></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slideUp delay-200">
                                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
                                        <h4 className="font-bold text-slate-800 text-lg">{t('collectionEvidence')}</h4>
                                        <button onClick={handleCaptureCollection} disabled={!!collectionPhoto} className="w-full bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 hover:scale-[1.02]">
                                            <CameraIcon /> {t('captureLocationAndPhoto')}
                                        </button>
                                        {collectionPhoto && <img src={collectionPhoto} alt="Collection" className="rounded-xl w-full max-w-xs mx-auto mt-2 border border-slate-100 shadow-sm animate-scaleIn" />}
                                        {collectionLocation && <p className="text-xs text-slate-400 font-medium bg-slate-50 py-1 px-2 rounded-full inline-block animate-fadeIn">Captured at: {collectionLocation.city}</p>}
                                    </div>
                                    <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow text-center space-y-4">
                                        <h4 className="font-bold text-slate-800 text-lg">{t('submissionEvidence')}</h4>
                                        <button onClick={handleCaptureSubmission} disabled={!!submissionPhoto} className="w-full bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 hover:scale-[1.02]">
                                            <CameraIcon /> {t('captureLocationAndPhoto')}
                                        </button>
                                        {submissionPhoto && <img src={submissionPhoto} alt="Submission" className="rounded-xl w-full max-w-xs mx-auto mt-2 border border-slate-100 shadow-sm animate-scaleIn" />}
                                        {submissionLocation && <p className="text-xs text-slate-400 font-medium bg-slate-50 py-1 px-2 rounded-full inline-block animate-fadeIn">Captured at: {submissionLocation.city}</p>}
                                    </div>
                                </div>

                                <button onClick={handleSubmitToLab} disabled={!collectionPhoto || !submissionPhoto} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-2xl transition duration-300 transform hover:scale-[1.01] active:scale-95 shadow-xl shadow-blue-600/20 disabled:bg-slate-300 disabled:text-slate-500 disabled:from-slate-300 disabled:to-slate-300 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed text-lg">
                                    {t('submitBatchToLab')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: History Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl bg-slate-50/50 sticky top-24">
                        <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BoxIcon className="w-5 h-5 text-blue-500" />
                            Collected Batches
                        </h4>
                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
                            {collectedBatches.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">
                                    <p>No batches collected yet.</p>
                                </div>
                            ) : (
                                collectedBatches.map((batch, index) => (
                                    <div key={batch.batchId} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold text-xs uppercase">
                                                {batch.herb.slice(0, 3)}
                                            </div>
                                            <div className="flex-grow">
                                                <h5 className="font-bold text-slate-800 text-sm">{batch.herb}</h5>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{batch.batchId}</span>
                                                    <button type="button" onClick={() => copyToClipboard(batch.batchId)} className="text-slate-400 hover:text-blue-600 transition-colors" title="Copy Batch ID">
                                                        {copiedId === batch.batchId ? <span className="text-[10px] font-bold text-blue-600">✓</span> : <CopyIcon className="w-3 h-3" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg">
                                            <p><strong className="text-slate-400">Collected:</strong><br />{new Date(batch.collectionDate).toLocaleDateString()}</p>
                                            <p><strong className="text-slate-400">Loc:</strong><br />{batch.collectionLocation?.city}</p>
                                        </div>
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

export default Collector;
