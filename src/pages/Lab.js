import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FlaskConicalIcon, LeafIcon, BoxIcon, CameraIcon, ChartBarIcon, CalendarIcon } from '../components/Icons';
import { translations } from '../utils/translations'; // Import explicitly if needed, or rely on prop but prop t is better

const Lab = ({ collectedBatches, labTestedBatches = [], addLabTestedBatch, t, language }) => {
  const initialTests = () => [
    { name: t('purity'), expected: '95-100%', tested: '', status: 'pending' },
    { name: t('moistureContent'), expected: '5-10%', tested: '', status: 'pending' },
    { name: t('heavyMetals'), expected: '<5ppm', tested: '', status: 'pending' },
    { name: t('pesticide'), expected: '<0.01ppm', tested: '', status: 'pending' },
    { name: t('microbial'), expected: '<1000CFU/g', tested: '', status: 'pending' }
  ];

  const [searchBatchId, setSearchBatchId] = useState('');
  const [foundBatch, setFoundBatch] = useState(null);
  const [error, setError] = useState('');
  const [submissionState, setSubmissionState] = useState('idle');

  const [batchReceivedPhoto, setBatchReceivedPhoto] = useState(null);
  const [batchReceivedLocation, setBatchReceivedLocation] = useState(null);
  const [testCompletedPhoto, setTestCompletedPhoto] = useState(null);
  const [testCompletedLocation, setTestCompletedLocation] = useState(null);
  const [packageSentPhoto, setPackageSentPhoto] = useState(null);
  const [packageSentLocation, setPackageSentLocation] = useState(null);

  const [qualityTests, setQualityTests] = useState(initialTests());

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [captureMode, setCaptureMode] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stats
  const stats = useMemo(() => {
    const totalTests = labTestedBatches.length;
    const passedTests = labTestedBatches.filter(b => b.finalStatus === 'pass').length;
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    return { totalTests, passRate };
  }, [labTestedBatches]);

  useEffect(() => {
    setQualityTests(initialTests());
  }, [t]);

  useEffect(() => {
    if (isCameraOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isCameraOpen, stream]);

  const handleFindBatch = (e) => {
    e.preventDefault();
    setError('');
    const batch = collectedBatches.find(b => b.batchId === searchBatchId);
    if (batch) {
      // Check if already tested
      const alreadyTested = labTestedBatches.find(b => b.batchId === searchBatchId);
      if (alreadyTested) {
        setError(`Batch ${searchBatchId} has already been tested.`);
        setFoundBatch(null);
      } else {
        setFoundBatch(batch);
      }
    } else {
      setError(t('batchIdNotFoundInSubmissions', { batchId: searchBatchId }));
      setFoundBatch(null);
    }
  };

  const fetchCityName = async (lat, lon, locationSetter) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
        headers: { 'User-Agent': 'Botanical Traceability POC/1.0' }
      });
      const data = await response.json();
      const city = data.address.city || data.address.town || data.address.village || 'Unknown Area';
      locationSetter(prev => ({ ...prev, city }));
    } catch (err) {
      console.error("City fetch error:", err);
      locationSetter(prev => ({ ...prev, city: 'Error fetching city' }));
    }
  };

  const handleCapture = (mode, photoSetter, locationSetter) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(5);
          const lon = position.coords.longitude.toFixed(5);
          locationSetter({ lat, lon, city: 'Fetching...' });
          fetchCityName(lat, lon, locationSetter);
          openCamera(mode, photoSetter);
        },
        (err) => setError(`Geolocation Error: ${err.message}`)
      );
    } else {
      setError("Geolocation is not supported.");
    }
  };

  const openCamera = async (mode, photoSetter) => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      setCaptureMode({ mode, photoSetter });
      setIsCameraOpen(true);
    } catch (err) {
      setError('Could not access the camera.');
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
    if (videoRef.current && canvasRef.current && captureMode) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      captureMode.photoSetter(dataUrl);
      closeCamera();
    }
  };

  const validateTest = (test) => {
    if (test.tested.trim() === '') return 'pending';
    const testedValue = parseFloat(test.tested);
    if (isNaN(testedValue)) return 'fail';

    const currentLangDict = (translations)[language] || translations.en;
    const testKey = Object.keys(currentLangDict).find(key => currentLangDict[key] === test.name);

    switch (testKey) {
      case 'purity': return testedValue >= 95 && testedValue <= 100 ? 'pass' : 'fail';
      case 'moistureContent': return testedValue >= 5 && testedValue <= 10 ? 'pass' : 'fail';
      case 'heavyMetals': return testedValue < 5 ? 'pass' : 'fail';
      case 'pesticide': return testedValue < 0.01 ? 'pass' : 'fail';
      case 'microbial': return testedValue < 1000 ? 'pass' : 'fail';
      default: return 'pending';
    }
  };

  const handleTestChange = (index, value) => {
    const updatedTests = [...qualityTests];
    const currentTest = { ...updatedTests[index], tested: value };
    currentTest.status = validateTest(currentTest);
    updatedTests[index] = currentTest;
    setQualityTests(updatedTests);
  };

  const allTestsCompleted = qualityTests.every(test => test.tested.trim() !== '');
  const allPhotosTaken = batchReceivedPhoto && testCompletedPhoto && packageSentPhoto;
  const hasFailedTests = qualityTests.some(test => test.status === 'fail');

  const handleSubmitResults = () => {
    const finalStatus = hasFailedTests ? 'fail' : 'pass';
    const testedBatch = {
      ...foundBatch,
      labEvidence: {
        batchReceivedPhoto, batchReceivedLocation,
        testCompletedPhoto, testCompletedLocation,
        packageSentPhoto, packageSentLocation
      },
      qualityTests,
      finalStatus
    };
    addLabTestedBatch(testedBatch);
    setSubmissionState(finalStatus === 'fail' ? 'submitted-fail' : 'submitted-pass');
  };

  const resetForm = () => {
    setSearchBatchId('');
    setFoundBatch(null);
    setError('');
    setSubmissionState('idle');
    setBatchReceivedPhoto(null);
    setBatchReceivedLocation(null);
    setTestCompletedPhoto(null);
    setTestCompletedLocation(null);
    setPackageSentPhoto(null);
    setPackageSentLocation(null);
    setQualityTests(initialTests());
  };

  const EvidenceCard = ({ title, onCapture, photo, location, disabled }) => (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow text-center space-y-3 hover:scale-[1.01] duration-300">
      <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
      <button onClick={onCapture} disabled={disabled} className="w-full bg-purple-50 hover:bg-purple-100 text-purple-600 border-2 border-purple-200 font-bold py-2 px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 text-xs">
        <CameraIcon className="w-4 h-4" /> {t('captureLocationAndPhoto')}
      </button>
      {photo && <img src={photo} alt={title} className="rounded-lg w-full max-w-[150px] mx-auto mt-2 border border-slate-100 shadow-sm animate-scaleIn" />}
      {location && <p className="text-[10px] text-slate-400 font-medium bg-slate-50 py-1 px-2 rounded-full inline-block animate-fadeIn">Loc: {location.city}</p>}
    </div>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass': return 'bg-emerald-50';
      case 'fail': return 'bg-red-50';
      default: return '';
    }
  };

  if (submissionState !== 'idle') {
    const isPass = submissionState === 'submitted-pass';
    return (
      <div className={`p-10 rounded-3xl shadow-lg border-2 text-center max-w-2xl mx-auto animate-scaleIn my-10 ${isPass ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isPass ? 'bg-emerald-100 animate-pulse-soft' : 'bg-red-100 animate-shake'}`}>
          <span className="text-4xl">{isPass ? '✅' : '⚠️'}</span>
        </div>
        <h3 className={`text-3xl font-bold mb-4 ${isPass ? 'text-emerald-800' : 'text-red-600'}`}>{isPass ? t('testResultsSubmittedPass') : t('testReportFailed')}</h3>
        <p className={`mb-8 text-lg font-medium ${isPass ? 'text-emerald-700' : 'text-red-700'}`}>
          {isPass ? t('batchReadyForManufacturing', { batchId: foundBatch.batchId }) : t('batchQualityFail', { batchId: foundBatch.batchId })}
        </p>
        <button onClick={resetForm} className="glass-button font-bold py-3 px-8 rounded-full shadow-lg transform hover:-translate-y-1 hover:scale-105 active:scale-95">
          {t('testAnotherBatch')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <FlaskConicalIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Tests Conducted</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalTests}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <ChartBarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Pass Rate</p>
            <p className="text-3xl font-bold text-slate-800">{stats.passRate}%</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100/50 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
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
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-3xl h-auto rounded-2xl shadow-2xl border-4 border-purple-500/30"></video>
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
          <div className="mt-8 flex gap-6">
            <button type="button" onClick={takePhoto} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 flex items-center gap-2 text-lg shadow-lg transform hover:-translate-y-1 hover:scale-105 active:scale-95">Take Photo</button>
            <button type="button" onClick={closeCamera} className="bg-white text-slate-700 hover:bg-slate-100 font-bold py-3 px-8 rounded-full transition duration-300 shadow-lg hover:scale-105 active:scale-95">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-8 rounded-3xl animate-fadeIn relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <FlaskConicalIcon className="w-64 h-64 text-purple-900" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3 border-b border-brand-green/10 pb-4 relative z-10">
              <div className="bg-purple-100 p-2 rounded-xl text-purple-600 animate-float"><FlaskConicalIcon className="w-6 h-6" /></div>
              {t('labPortal')}
            </h3>

            {!foundBatch ? (
              <form onSubmit={handleFindBatch} className="space-y-6 max-w-lg mx-auto bg-white/80 p-8 rounded-3xl shadow-sm border border-slate-100 animate-slideUp relative z-10">
                <div>
                  <label htmlFor="searchBatchIdLab" className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">{t('enterBatchIdToTest')}</label>
                  <div className="flex gap-3">
                    <input type="text" id="searchBatchIdLab" value={searchBatchId} onChange={e => setSearchBatchId(e.target.value)} className="input-modern w-full px-4 py-3" placeholder="FARM-BATCH-..." />
                    <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 shadow-lg shadow-purple-500/20 whitespace-nowrap hover:scale-105 active:scale-95">{t('find')}</button>
                  </div>
                </div>
                {error && <p className="text-red-500 text-sm text-center font-bold bg-red-50 py-3 rounded-xl border border-red-100 animate-shake">{error}</p>}
              </form>
            ) : (
              <div className="space-y-8 animate-slideUp relative z-10 w-full">
                <button onClick={resetForm} className="text-sm text-purple-600 hover:text-purple-800 font-bold mb-6 flex items-center gap-1 transition-colors hover:-translate-x-1 duration-200">
                  <span className="text-lg">←</span> {t('testAnotherBatch')}
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-fadeIn delay-100">
                    <h4 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                      <LeafIcon className="w-5 h-5" />
                      {t('farmerData')}
                    </h4>
                    <span className="block mb-2 font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 w-fit">{foundBatch.batchId}</span>
                    <div className="space-y-2 text-sm">
                      <p className="flex justify-between border-b border-slate-200 pb-1"><span>{t('herb')}:</span> <span className="font-semibold text-slate-800">{foundBatch.herb}</span></p>
                      <p className="flex justify-between border-b border-slate-200 pb-1"><span>{t('weightKg')}:</span> <span className="font-semibold text-slate-800">{foundBatch.weight}</span></p>
                      <p className="flex justify-between"><span>{t('quantity')}:</span> <span className="font-semibold text-slate-800">{foundBatch.quantity}</span></p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 animate-fadeIn delay-200">
                    <h4 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
                      <BoxIcon className="w-5 h-5" />
                      {t('collectorData')}
                    </h4>
                    <div className="space-y-4 text-sm">
                      <div>
                        <strong className="text-slate-400 block text-xs uppercase tracking-wide mb-1">{t('collection')}</strong>
                        <div className="text-slate-800 font-medium">{foundBatch.collectionLocation.city}</div>
                        <div className="text-slate-400 text-xs">({foundBatch.collectionLocation.lat}, {foundBatch.collectionLocation.lon})</div>
                      </div>
                      <div>
                        <strong className="text-slate-400 block text-xs uppercase tracking-wide mb-1">{t('submissionEvidence')}</strong>
                        <div className="text-slate-800 font-medium">{foundBatch.submissionLocation.city}</div>
                        <div className="text-slate-400 text-xs">({foundBatch.submissionLocation.lat}, {foundBatch.submissionLocation.lon})</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideUp delay-300 w-full">
                  <EvidenceCard title={t('batchReceived')} onCapture={() => handleCapture('received', setBatchReceivedPhoto, setBatchReceivedLocation)} photo={batchReceivedPhoto} location={batchReceivedLocation} disabled={!!batchReceivedPhoto} />
                  <EvidenceCard title={t('testCompleted')} onCapture={() => handleCapture('completed', setTestCompletedPhoto, setTestCompletedLocation)} photo={testCompletedPhoto} location={testCompletedLocation} disabled={!!testCompletedPhoto} />
                  <EvidenceCard title={t('packageSent')} onCapture={() => handleCapture('sent', setPackageSentPhoto, setPackageSentLocation)} photo={packageSentPhoto} location={packageSentLocation} disabled={!!packageSentPhoto} />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full">
                  <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4"><FlaskConicalIcon className="w-5 h-5 text-purple-600" /> {t('qualityTestResults')}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
                        <tr>
                          <th scope="col" className="px-4 py-3 rounded-l-lg">{t('testName')}</th>
                          <th scope="col" className="px-4 py-3">{t('expectedRange')}</th>
                          <th scope="col" className="px-4 py-3">{t('testedRange')}</th>
                          <th scope="col" className="px-4 py-3 rounded-r-lg">{t('status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {qualityTests.map((test, index) => (
                          <tr key={test.name} className={`transition-colors duration-300 ${getStatusColor(test.status)}`}>
                            <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap text-slate-800">{test.name}</th>
                            <td className="px-4 py-3 font-mono text-slate-500 text-xs">{test.expected}</td>
                            <td className="px-4 py-3">
                              <input type="text" value={test.tested} onChange={(e) => handleTestChange(index, e.target.value)} className="input-modern w-full px-2 py-1 text-sm bg-white" placeholder="..." />
                            </td>
                            <td className="px-4 py-3 font-bold uppercase text-[10px] tracking-wider">
                              <span className={`px-2 py-1 rounded-full animate-scaleIn shadow-sm ${test.status === 'pass' ? 'bg-emerald-100 text-emerald-700' : test.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
                                {t(test.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {hasFailedTests && (
                  <div className="p-4 text-center bg-red-50 border border-red-200 rounded-xl shadow-sm animate-pulse-soft">
                    <p className="font-bold text-red-600 flex items-center justify-center gap-2">
                      <span className="text-2xl">⚠️</span> {t('failedTestWarning')}
                    </p>
                  </div>
                )}

                <button onClick={handleSubmitResults} disabled={!allPhotosTaken || !allTestsCompleted} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-2xl transition duration-300 transform hover:scale-[1.01] shadow-xl shadow-purple-600/20 disabled:bg-slate-300 disabled:text-slate-500 disabled:from-slate-300 disabled:to-slate-300 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed text-lg active:scale-95">
                  {t('submitTestResults')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History Sidebar */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl bg-purple-50/50 sticky top-24">
            <h4 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FlaskConicalIcon className="w-5 h-5 text-purple-500" />
              Test History
            </h4>
            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin">
              {labTestedBatches.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>No batches tested yet.</p>
                </div>
              ) : (
                labTestedBatches.map((batch, index) => (
                  <div key={batch.batchId} className={`bg-white p-4 rounded-xl border ${batch.finalStatus === 'pass' ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-200 bg-red-50/20'} shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-3 group`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${batch.finalStatus === 'pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {batch.finalStatus === 'pass' ? '✓' : '✗'}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">{batch.herb}</h5>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{batch.batchId}</span>
                      </div>
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

export default Lab;