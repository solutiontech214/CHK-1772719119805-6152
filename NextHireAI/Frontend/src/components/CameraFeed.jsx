import { useRef, useEffect, useState } from "react";

export default function CameraFeed({ onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStream(mediaStream);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      if (onCapture) onCapture(dataUrl);
    }
  };

  // Automatically capture frame every 5 seconds for analysis
  useEffect(() => {
    const interval = setInterval(captureFrame, 10000); // 10 seconds is more reasonable for API calls
    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "300px", aspectRatio: "4/3", borderRadius: "12px", overflow: "hidden", border: "2px solid var(--border-color)", marginBottom: "1rem" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div style={{ position: "absolute", bottom: "8px", left: "8px", background: "rgba(0,0,0,0.5)", color: "white", padding: "2px 8px", fontSize: "10px", borderRadius: "4px" }}>
        LIVE FEED
      </div>
    </div>
  );
}
