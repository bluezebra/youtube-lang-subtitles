(function () {
  const bannerId = "yt-dual-subtitles-hello";

  function showHelloWorldBanner() {
    let banner = document.getElementById(bannerId);

    if (!banner) {
      banner = document.createElement("div");
      banner.id = bannerId;
      banner.setAttribute("role", "status");
      document.documentElement.appendChild(banner);
    }

    banner.textContent = "Hello world - YouTube Dual Subtitles extension is running";
    Object.assign(banner.style, {
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: "2147483647",
      padding: "10px 14px",
      color: "#ffffff",
      background: "#1a73e8",
      borderRadius: "8px",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      fontWeight: "700"
    });
  }

  showHelloWorldBanner();
})();
