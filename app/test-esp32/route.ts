import { NextResponse } from 'next/server'

export async function GET() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ESP32 API Test - Next.js Served</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    #status { font-weight: bold; }
    .success { color: green; }
    .error { color: red; }
    .waiting { color: orange; }
  </style>
</head>
<body>
  <h2>🧪 ESP32 API Test Dashboard</h2>
  <p>Status: <span id="status" class="waiting">Waiting...</span></p>
  <p>Sent: <span id="count">0</span> requests</p>
  <button onclick="sendData()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Send Now</button>
  <button onclick="toggleAutoSend()" style="padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Toggle Auto-Send</button>
  
  <h3>📊 Latest Response:</h3>
  <pre id="log">No data sent yet...</pre>

  <h3>📈 Recent Requests:</h3>
  <div id="history"></div>

  <script>
    const endpoint = "/api/esp32"; // Same origin - no CORS issues!
    let count = 0;
    let autoSend = true;
    let interval;

    function sendData() {
      const data = {
        stationId: "VCBI", // ✅ Match dashboard station ID
        temperature: parseFloat((25 + Math.random() * 5).toFixed(1)),
        humidity: parseFloat((60 + Math.random() * 10).toFixed(1)),
        pressure: parseFloat((1010 + Math.random() * 6).toFixed(1)),
        dewPoint: parseFloat((20 + Math.random() * 5).toFixed(1)),
        windSpeed: parseFloat((5 + Math.random() * 10).toFixed(1)),
        windDirection: Math.floor(Math.random() * 360),
        lat: 9.8580,
        lng: 80.0340,
        utcTime: new Date().toISOString().substr(11, 8) // HH:MM:SS
      };

      const startTime = Date.now();
      
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      .then(res => {
        const responseTime = Date.now() - startTime;
        if (!res.ok) throw new Error(\`HTTP \${res.status}: \${res.statusText}\`);
        return res.json();
      })
      .then(resp => {
        count++;
        document.getElementById("count").textContent = count;
        document.getElementById("status").textContent = "Success ✅";
        document.getElementById("status").className = "success";
        document.getElementById("log").textContent = JSON.stringify(resp, null, 2);
        
        // Add to history
        addToHistory("✅ SUCCESS", resp, Date.now() - startTime);
      })
      .catch(err => {
        document.getElementById("status").textContent = "Error ❌";
        document.getElementById("status").className = "error";
        document.getElementById("log").textContent = \`Error: \${err.message}\`;
        
        // Add to history
        addToHistory("❌ ERROR", { error: err.message }, Date.now() - startTime);
      });
    }

    function addToHistory(status, data, responseTime) {
      const historyDiv = document.getElementById("history");
      const entry = document.createElement("div");
      entry.style.cssText = "margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f9f9f9;";
      entry.innerHTML = \`
        <strong>\${new Date().toLocaleTimeString()}</strong> - \${status} (\${responseTime}ms)
        <br><small>Station: \${data.data?.stationId || 'N/A'} | ID: \${data.data?.id?.substr(0, 8) || 'N/A'}</small>
      \`;
      historyDiv.insertBefore(entry, historyDiv.firstChild);
      
      // Keep only last 5 entries
      while (historyDiv.children.length > 5) {
        historyDiv.removeChild(historyDiv.lastChild);
      }
    }

    function toggleAutoSend() {
      autoSend = !autoSend;
      const button = event.target;
      
      if (autoSend) {
        button.textContent = "Stop Auto-Send";
        button.style.background = "#dc3545";
        startAutoSend();
      } else {
        button.textContent = "Start Auto-Send";
        button.style.background = "#28a745";
        stopAutoSend();
      }
    }

    function startAutoSend() {
      if (interval) clearInterval(interval);
      interval = setInterval(sendData, 5000);
    }

    function stopAutoSend() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    // Start immediately
    sendData();
    startAutoSend();

    // Update button state on load
    document.addEventListener("DOMContentLoaded", () => {
      const button = document.querySelector('button[onclick="toggleAutoSend()"]');
      button.textContent = "Stop Auto-Send";
      button.style.background = "#dc3545";
    });
  </script>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}