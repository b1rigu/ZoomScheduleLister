"use client";

export function ZoomAddButton() {
  const handleZoomLogin = () => {
    window.location.href = "api/zoomAuth";
  };

  return (
    <button
      onClick={handleZoomLogin}
      className="py-1 px-2 flex rounded-md bg-slate-500/20 hover:bg-slate-500/30"
    >
      Add New
    </button>
  );
}
