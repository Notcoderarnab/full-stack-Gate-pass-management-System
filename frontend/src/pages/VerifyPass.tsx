import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Camera, CameraOff, CheckCircle2, LogOut, QrCode, ScanLine, ShieldCheck, XCircle } from "lucide-react";
import jsQR from "jsqr";
import { ApiUser, authApi, getCurrentUser, guardApi } from "../services/api";

export default function VerifyPass() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const [qrToken, setQrToken] = useState(tokenFromUrl);
  const [result, setResult] = useState<{ success: boolean; message: string; visitor?: Record<string, string> } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scannerStatus, setScannerStatus] = useState("");
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(() => getCurrentUser());
  const [isCheckingUser, setIsCheckingUser] = useState(Boolean(localStorage.getItem("accessToken")));
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingFrameRef = useRef(false);
  const capturedQrRef = useRef("");

  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      setIsCheckingUser(false);
      return;
    }

    authApi
      .me()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null))
      .finally(() => setIsCheckingUser(false));
  }, []);

  const canScan = useMemo(() => currentUser?.role === "GUARD" || currentUser?.role === "ADMIN", [currentUser]);

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOpen(false);
    setScannerStatus("");
  }, []);

  const scanPass = useCallback(
    async (tokenOverride?: string) => {
      const tokenToScan = (tokenOverride ?? qrToken).trim();

      if (!tokenToScan) {
        setResult({ success: false, message: "QR token is required." });
        return;
      }

      try {
        setIsScanning(true);
        const data = await guardApi.scan(tokenToScan);
        setResult({ success: true, message: data.message || "Entry granted.", visitor: data.visitor });
      } catch (error: any) {
        setResult({
          success: false,
          message: error?.response?.data?.message || "QR verification failed.",
        });
      } finally {
        setIsScanning(false);
      }
    },
    [qrToken]
  );

  const startCamera = async () => {
    setCameraError("");
    capturedQrRef.current = "";

    if (!canScan) {
      setCameraError("Sign in as a guard or admin before scanning.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setResult(null);
      setIsCameraOpen(true);
      setScannerStatus("Camera ready. Hold the QR pass inside the frame.");
    } catch (error: any) {
      setCameraError(error?.name === "NotAllowedError" ? "Camera permission was denied." : "Could not open the camera.");
      stopCamera();
    }
  };

  useEffect(() => {
    if (!isCameraOpen || !canScan || !videoRef.current) {
      return;
    }

    let cancelled = false;

    const scanFrame = () => {
      if (cancelled) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video?.videoWidth || 0;
      const height = video?.videoHeight || 0;

      if (video && canvas && width > 0 && height > 0 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !isProcessingFrameRef.current) {
        isProcessingFrameRef.current = true;

        try {
          const context = canvas.getContext("2d", { willReadFrequently: true });

          if (!context) {
            setCameraError("Could not prepare the QR scanner.");
            stopCamera();
            return;
          }

          if (canvas.width !== width) {
            canvas.width = width;
          }

          if (canvas.height !== height) {
            canvas.height = height;
          }

          context.drawImage(video, 0, 0, width, height);

          const imageData = context.getImageData(0, 0, width, height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });
          const rawValue = qrCode?.data?.trim();

          if (rawValue && capturedQrRef.current !== rawValue) {
            capturedQrRef.current = rawValue;
            setQrToken(rawValue);
            setScannerStatus("QR captured. Verifying pass...");
            stopCamera();
            void scanPass(rawValue);
            return;
          }
        } catch {
          setCameraError("Could not read the camera frame.");
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      cancelled = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [canScan, isCameraOpen, scanPass, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleManualScan = () => {
    if (isCameraOpen) {
      stopCamera();
    }

    scanPass();
  };

  const logout = async () => {
    stopCamera();
    await authApi.logout();
    setCurrentUser(null);
    navigate("/signin", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16 text-slate-950">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <QrCode size={26} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-sky-700">Gate verification</p>
              <h1 className="text-2xl font-black tracking-tight">Scan QR pass</h1>
            </div>
          </div>
          {currentUser && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-50"
            >
              <LogOut size={15} />
              Logout
            </button>
          )}
        </div>

        {!isCheckingUser && !canScan && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            Sign in as a guard to validate QR passes. Admin users can test this screen too.
            <Link to="/signin" className="ml-2 font-black text-amber-950 underline">
              Login
            </Link>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">QR token, pass ID, or URL</span>
          <input
            value={qrToken}
            onChange={(event) => setQrToken(event.target.value)}
            placeholder="Paste QR token, pass ID, or full verify URL"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
          />
        </label>

        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
          <div className="relative aspect-video w-full">
            <video
              ref={videoRef}
              className={`h-full w-full object-cover ${isCameraOpen ? "block" : "hidden"}`}
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {!isCameraOpen && (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-900 text-slate-300">
                <ScanLine size={34} />
                <p className="text-sm font-bold">Camera scanner</p>
              </div>
            )}

            {isCameraOpen && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-44 w-44 rounded-lg border-2 border-sky-300 shadow-[0_0_0_999px_rgba(15,23,42,0.35)]" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm font-semibold text-slate-600">
              {cameraError || scannerStatus || "Open the camera to capture a QR pass."}
            </div>
            <button
              onClick={isCameraOpen ? stopCamera : startCamera}
              disabled={isCheckingUser || !canScan || isScanning}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCameraOpen ? <CameraOff size={16} /> : <Camera size={16} />}
              {isCameraOpen ? "Stop camera" : "Capture QR"}
            </button>
          </div>
        </div>

        <button
          onClick={handleManualScan}
          disabled={isCheckingUser || !canScan || isScanning}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ShieldCheck size={16} />
          {isCheckingUser ? "Checking sign in..." : isScanning ? "Verifying..." : "Verify pass"}
        </button>

        {result && (
          <div className={`mt-6 rounded-lg border p-4 ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
            <div className="mb-2 flex items-center gap-2 font-black">
              {result.success ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              {result.message}
            </div>
            {result.visitor && (
              <div className="mt-3 grid gap-1 text-sm">
                {Object.entries(result.visitor).map(([key, value]) => (
                  <p key={key}>
                    <span className="font-bold capitalize">{key}: </span>
                    {value}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <Link to="/" className="mt-6 inline-block text-sm font-bold text-sky-700 hover:underline">
          Back to home
        </Link>
      </section>
    </main>
  );
}
