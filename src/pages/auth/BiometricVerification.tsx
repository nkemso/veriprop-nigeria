import React, { useState, useRef, useEffect, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

type Step = 'intro' | 'camera' | 'liveness' | 'checking' | 'success' | 'failed'

const LIVENESS_PROMPTS = [
  { text: 'Look straight at the camera', icon: '👀', duration: 2500 },
  { text: 'Slowly turn your head LEFT', icon: '⬅️', duration: 2500 },
  { text: 'Slowly turn your head RIGHT', icon: '➡️', duration: 2500 },
  { text: 'Blink your eyes twice', icon: '👁️', duration: 2000 },
  { text: 'Smile naturally', icon: '😊', duration: 2000 },
]

export default function BiometricVerification() {
  const [step, setStep] = useState<Step>('intro')
  const [promptIdx, setPromptIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [faceDetected, setFaceDetected] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [provider, setProvider] = useState('')
  const [livenessScore, setLivenessScore] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const token = localStorage.getItem('accessToken')

  // Start camera
  const startCamera = useCallback(async () => {
    setError('')
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
        await videoRef.current.play()
      }
      setStep('camera')
      setTimeout(() => setFaceDetected(true), 1500)
    } catch {
      setError('Camera access denied. Please allow camera access in your browser settings and try again.')
      setStep('failed')
    }
  }, [])

  useEffect(() => {
    return () => { stream?.getTracks().forEach(t => t.stop()) }
  }, [stream])

  // Capture selfie from video
  const captureSelfie = useCallback((): string | null => {
    if (!canvasRef.current || !videoRef.current) return null
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0)
    return canvas.toDataURL('image/jpeg', 0.85)
  }, [])

  // Run guided liveness prompts
  const runLiveness = useCallback(() => {
    setStep('liveness')
    setProgress(0)
    setPromptIdx(0)

    const totalDuration = LIVENESS_PROMPTS.reduce((s, p) => s + p.duration, 0)
    let elapsed = 0
    let idx = 0

    const runNext = () => {
      if (idx >= LIVENESS_PROMPTS.length) {
        const img = captureSelfie()
        if (img) setCapturedImage(img)
        stream?.getTracks().forEach(t => t.stop())
        setStep('checking')
        submitToDilit(img)
        return
      }
      setPromptIdx(idx)
      const dur = LIVENESS_PROMPTS[idx].duration
      elapsed += dur
      setProgress(Math.min(100, Math.round((elapsed / totalDuration) * 100)))
      setTimeout(() => { idx++; runNext() }, dur)
    }
    runNext()
  }, [captureSelfie, stream])

  // Submit to Didit KYC via backend — NO auto-pass on failure
  const submitToDilit = useCallback(async (imageData: string | null) => {
    try {
      const res = await fetch(`${API}/api/v1/verify/biometric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selfieImage: imageData,
          capturedAt: new Date().toISOString(),
        }),
      })

      const data = await res.json()

      if (data.success) {
        setProvider(data.provider || 'didit')
        setLivenessScore(data.livenessScore || 0)
        // Update local user state
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({
          ...user,
          notaryVerified: true,
          verificationTier: 'TIER3_NOTARY',
          ...(data.user || {}),
        }))
        window.dispatchEvent(new Event('userUpdated'))
        setStep('success')
      } else {
        // ⛔ REAL FAILURE — do NOT auto-pass
        setError(data.message || 'Liveness check failed. Please try again with better lighting.')
        setStep('failed')
      }
    } catch (err) {
      // ⛔ NETWORK ERROR — do NOT auto-pass. Fail safely.
      setError('Network error. Please check your connection and try again. Verification cannot proceed offline.')
      setStep('failed')
    }
  }, [token])

  // Countdown before liveness
  const startCountdown = useCallback(() => {
    setCountdown(3)
    let c = 3
    const t = setInterval(() => {
      c--
      setCountdown(c)
      if (c <= 0) { clearInterval(t); runLiveness() }
    }, 1000)
  }, [runLiveness])

  const reset = () => {
    setStep('intro'); setProgress(0); setPromptIdx(0)
    setFaceDetected(false); setCapturedImage(null); setError('')
    setCountdown(3)
  }

  const S = { fontFamily: 'Inter,sans-serif' }

  // ── INTRO ──────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div style={{ minHeight:'100vh', background:'#0d1117', ...S }}>
      <nav style={{ background:'#161b22', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #21262d' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'1.2rem' }}>🛡️</span>
          <span style={{ color:'#10b981', fontSize:'0.7rem', fontWeight:700 }}>POWERED BY DIDIT KYC</span>
        </div>
      </nav>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'2rem 1rem', color:'#f0f6fc' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'4rem', marginBottom:'0.75rem' }}>🤳</div>
          <h1 style={{ fontWeight:900, fontSize:'1.75rem', margin:'0 0 0.5rem' }}>Selfie Liveness Check</h1>
          <p style={{ color:'#8b949e', lineHeight:1.7, margin:0 }}>
            Powered by <strong style={{ color:'#60a5fa' }}>Didit</strong> — certified AI biometric verification. Your selfie is verified in real-time against anti-spoofing AI.
          </p>
        </div>

        {/* Security badge */}
        <div style={{ background:'rgba(29,78,216,0.1)', border:'1px solid rgba(29,78,216,0.3)', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1.5rem', display:'flex', gap:'0.875rem', alignItems:'center' }}>
          <div style={{ fontSize:'2rem' }}>🛡️</div>
          <div>
            <div style={{ fontWeight:700, color:'#60a5fa', fontSize:'0.875rem' }}>Zero-Trust Biometric Verification</div>
            <div style={{ color:'#8b949e', fontSize:'0.8rem' }}>Didit AI detects printed photos, screen replays, and masks. Only real, live persons pass. NDPR 2019 compliant.</div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <h3 style={{ fontWeight:700, margin:'0 0 1rem', color:'#f0f6fc' }}>Guided liveness steps:</h3>
          {LIVENESS_PROMPTS.map((p, i) => (
            <div key={i} style={{ display:'flex', gap:'0.875rem', padding:'0.625rem 0', borderBottom: i < LIVENESS_PROMPTS.length-1 ? '1px solid #21262d':'none', alignItems:'center' }}>
              <span style={{ fontSize:'1.5rem', width:32, textAlign:'center', flexShrink:0 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight:600, color:'#f0f6fc', fontSize:'0.875rem' }}>Step {i+1}</div>
                <div style={{ color:'#8b949e', fontSize:'0.8rem' }}>{p.text}</div>
              </div>
              <span style={{ marginLeft:'auto', color:'#6e7681', fontSize:'0.7rem' }}>{p.duration/1000}s</span>
            </div>
          ))}
        </div>

        {!token && (
          <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#f87171', fontSize:'0.875rem' }}>
            ⚠️ Please <a href="/login" style={{ color:'#60a5fa' }}>log in</a> first to complete biometric verification.
          </div>
        )}

        <button onClick={startCamera} disabled={!token}
          style={{ width:'100%', padding:'1rem', background: token ? '#10b981':'#21262d', color: token ? '#fff':'#6e7681', border:'none', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.05rem', cursor: token ? 'pointer':'not-allowed', marginBottom:'0.75rem', boxShadow: token ? '0 8px 24px rgba(16,185,129,0.3)':'none' }}>
          🤳 Start Didit Biometric Verification →
        </button>
        <a href="/verify" style={{ display:'block', color:'#6e7681', fontSize:'0.8rem', textDecoration:'none', textAlign:'center' }}>← Back to Verification Hub</a>
      </div>
    </div>
  )

  // ── CAMERA ────────────────────────────────────────────────────
  if (step === 'camera') return (
    <div style={{ minHeight:'100vh', background:'#0d1117', ...S, color:'#f0f6fc' }}>
      <nav style={{ background:'#161b22', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #21262d' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp</a>
        <span style={{ color:'#10b981', fontSize:'0.7rem', fontWeight:700 }}>LIVE CAMERA</span>
      </nav>
      <div style={{ maxWidth:520, margin:'0 auto', padding:'1.5rem 1rem' }}>
        <div style={{ textAlign:'center', marginBottom:'1rem' }}>
          <h2 style={{ fontWeight:800, margin:0 }}>Position Your Face</h2>
          <p style={{ color:'#8b949e', fontSize:'0.8rem', margin:'0.25rem 0 0' }}>Center your face in the frame. Good lighting required.</p>
        </div>

        <div style={{ position:'relative', width:'100%', borderRadius:'1rem', overflow:'hidden', background:'#000', aspectRatio:'4/3', marginBottom:'1.5rem' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display:'block' }} />
          {/* Face guide overlay */}
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <div style={{ width:'55%', aspectRatio:'3/4', border:`3px dashed ${faceDetected ? '#10b981':'#f59e0b'}`, borderRadius:'50%', opacity:0.7 }} />
          </div>
          <div style={{ position:'absolute', bottom:8, right:8, color:'rgba(255,255,255,0.5)', fontSize:'0.6rem' }}>Didit AI</div>
        </div>

        <button onClick={startCountdown} disabled={!faceDetected}
          style={{ width:'100%', padding:'1rem', background: faceDetected ? '#10b981':'#21262d', color: faceDetected ? '#fff':'#6e7681', border:'none', borderRadius:'0.875rem', fontWeight:800, cursor: faceDetected ? 'pointer':'not-allowed', fontSize:'1rem' }}>
          {faceDetected ? '📸 Begin Didit Liveness Check →' : '⏳ Detecting face...'}
        </button>
      </div>
      <canvas ref={canvasRef} style={{ display:'none' }} />
    </div>
  )

  // ── LIVENESS ──────────────────────────────────────────────────
  if (step === 'liveness') return (
    <div style={{ minHeight:'100vh', background:'#0d1117', ...S, color:'#f0f6fc', display:'flex', flexDirection:'column' }}>
      <nav style={{ background:'#161b22', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #21262d' }}>
        <span style={{ color:'#fff', fontWeight:800 }}>🏠 VeriProp</span>
        <span style={{ color:'#10b981', fontSize:'0.7rem', fontWeight:700 }}>SCANNING...</span>
      </nav>
      <div style={{ maxWidth:440, margin:'0 auto', padding:'1.5rem 1rem', flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
        <div style={{ position:'relative', width:'100%', borderRadius:'1rem', overflow:'hidden', background:'#000', aspectRatio:'4/3', marginBottom:'1.5rem' }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', display:'block' }} />
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:'3rem' }}>{LIVENESS_PROMPTS[Math.min(promptIdx, LIVENESS_PROMPTS.length-1)]?.icon}</div>
          </div>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:4, background:'rgba(255,255,255,0.2)' }}>
            <div style={{ height:'100%', background:'#10b981', width:`${progress}%`, transition:'width 0.3s' }} />
          </div>
        </div>

        <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:'1rem', padding:'1.25rem', width:'100%', textAlign:'center' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.5rem' }}>{LIVENESS_PROMPTS[Math.min(promptIdx, LIVENESS_PROMPTS.length-1)]?.icon}</div>
          <div style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'0.5rem' }}>{LIVENESS_PROMPTS[Math.min(promptIdx, LIVENESS_PROMPTS.length-1)]?.text}</div>
          <div style={{ display:'flex', gap:'0.375rem', justifyContent:'center', marginTop:'0.75rem' }}>
            {LIVENESS_PROMPTS.map((_, i) => (
              <div key={i} style={{ width: i === promptIdx ? 20 : 8, height:8, borderRadius:999, background: i <= promptIdx ? '#10b981':'#21262d', transition:'all 0.3s' }} />
            ))}
          </div>
          <div style={{ color:'#6e7681', fontSize:'0.75rem', marginTop:'0.5rem' }}>Step {Math.min(promptIdx+1, LIVENESS_PROMPTS.length)}/{LIVENESS_PROMPTS.length}</div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display:'none' }} />
    </div>
  )

  // ── CHECKING ──────────────────────────────────────────────────
  if (step === 'checking') return (
    <div style={{ minHeight:'100vh', background:'#0d1117', ...S, color:'#f0f6fc', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {capturedImage && (
        <div style={{ width:140, height:140, borderRadius:'50%', overflow:'hidden', border:'4px solid #10b981', marginBottom:'1.5rem', transform:'scaleX(-1)' }}>
          <img src={capturedImage} alt="selfie" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      )}
      <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🔍</div>
      <h2 style={{ fontWeight:800, marginBottom:'0.5rem' }}>Didit AI Analyzing...</h2>
      <p style={{ color:'#8b949e', marginBottom:'2rem', fontSize:'0.875rem', textAlign:'center' }}>
        Real AI is verifying your liveness. No simulations — this is a genuine check.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', width:'100%', maxWidth:360 }}>
        {['Anti-spoofing detection', 'Passive liveness analysis', 'Face quality verification', 'Identity confirmation'].map((check) => (
          <div key={check} style={{ display:'flex', alignItems:'center', gap:'0.75rem', background:'#161b22', padding:'0.75rem 1rem', borderRadius:'0.5rem', border:'1px solid #21262d' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', border:'2px solid #10b981', borderTopColor:'transparent', animation:'spin 1s linear infinite', flexShrink:0 }} />
            <span style={{ fontSize:'0.875rem', color:'#8b949e' }}>{check}...</span>
          </div>
        ))}
      </div>
      <p style={{ color:'#6e7681', fontSize:'0.7rem', marginTop:'1.5rem' }}>Powered by Didit AI · NDPR Compliant</p>
    </div>
  )

  // ── SUCCESS ───────────────────────────────────────────────────
  if (step === 'success') return (
    <div style={{ minHeight:'100vh', background:'#0d1117', ...S, color:'#f0f6fc', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      {capturedImage && (
        <div style={{ position:'relative', width:140, height:140, marginBottom:'1.5rem' }}>
          <div style={{ width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden', border:'4px solid #10b981', transform:'scaleX(-1)' }}>
            <img src={capturedImage} alt="verified" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ position:'absolute', bottom:4, right:4, width:36, height:36, borderRadius:'50%', background:'#10b981', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', border:'3px solid #0d1117' }}>✓</div>
        </div>
      )}
      <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🎉</div>
      <h1 style={{ fontWeight:900, color:'#10b981', marginBottom:'0.5rem', fontSize:'1.75rem' }}>Biometrically Verified!</h1>
      <p style={{ color:'#8b949e', marginBottom:'1.5rem', fontSize:'0.875rem', textAlign:'center' }}>
        Didit AI has confirmed your identity. You are now <strong style={{ color:'#10b981' }}>Tier 3 Verified</strong>.
      </p>

      <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'1rem', padding:'1.25rem', marginBottom:'1.5rem', width:'100%', maxWidth:400 }}>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', fontSize:'0.8rem', borderBottom:'1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ color:'#8b949e' }}>Verification Provider</span>
          <span style={{ color:'#10b981', fontWeight:700 }}>Didit AI</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', fontSize:'0.8rem', borderBottom:'1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ color:'#8b949e' }}>Liveness Score</span>
          <span style={{ color:'#10b981', fontWeight:700 }}>{livenessScore}/100</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', fontSize:'0.8rem', borderBottom:'1px solid rgba(16,185,129,0.2)' }}>
          <span style={{ color:'#8b949e' }}>Tier Achieved</span>
          <span style={{ color:'#10b981', fontWeight:700 }}>Tier 3 — Biometric ✅</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', padding:'0.4rem 0', fontSize:'0.8rem' }}>
          <span style={{ color:'#8b949e' }}>Verified At</span>
          <span style={{ color:'#10b981', fontWeight:700 }}>{new Date().toLocaleString('en-NG')}</span>
        </div>
      </div>

      <div style={{ width:'100%', maxWidth:400, marginBottom:'1.5rem' }}>
        {['Full marketplace access', 'High-value escrow transactions', 'Multi-sig transaction rights', 'Biometric Trustmark badge', 'Priority listing visibility'].map(b => (
          <div key={b} style={{ color:'#f0f6fc', fontSize:'0.8rem', padding:'0.3rem 0', display:'flex', gap:'0.5rem' }}>
            <span style={{ color:'#10b981' }}>✅</span> {b}
          </div>
        ))}
      </div>

      <a href="/dashboard" style={{ display:'block', width:'100%', maxWidth:400, textAlign:'center', background:'#10b981', color:'#fff', padding:'1rem', borderRadius:'0.875rem', fontWeight:800, textDecoration:'none', marginBottom:'0.75rem' }}>
        🏠 Go to Dashboard →
      </a>
      <a href="/properties" style={{ display:'block', color:'#6e7681', padding:'0.5rem', fontSize:'0.875rem', textDecoration:'none', textAlign:'center' }}>
        Browse Verified Properties →
      </a>
    </div>
  )

  // ── FAILED ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', ...S, color:'#f0f6fc', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>❌</div>
      <h2 style={{ fontWeight:800, color:'#ef4444', marginBottom:'0.5rem' }}>Verification Failed</h2>
      <p style={{ color:'#8b949e', marginBottom:'2rem', lineHeight:1.7, fontSize:'0.875rem', textAlign:'center', maxWidth:380 }}>
        {error || 'Didit AI could not verify your liveness. Please ensure good lighting and try again.'}
      </p>
      <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:'0.875rem', padding:'1.25rem', marginBottom:'1.5rem', width:'100%', maxWidth:380 }}>
        <div style={{ fontWeight:700, color:'#f0f6fc', marginBottom:'0.75rem', fontSize:'0.875rem' }}>Tips for success:</div>
        {['Find a well-lit area (face a window)', 'Hold phone at eye level', 'Remove glasses or hat', 'Use front-facing camera only', 'Follow each prompt slowly'].map(t => (
          <div key={t} style={{ color:'#8b949e', padding:'0.25rem 0', fontSize:'0.8rem' }}>• {t}</div>
        ))}
      </div>
      <button onClick={reset} style={{ width:'100%', maxWidth:380, padding:'1rem', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:'0.875rem', fontWeight:800, cursor:'pointer', fontSize:'1rem', marginBottom:'0.75rem' }}>
        🔄 Try Again
      </button>
      <a href="/verify" style={{ color:'#6e7681', fontSize:'0.8rem', textDecoration:'none' }}>← Back to Verification Hub</a>
    </div>
  )
}
