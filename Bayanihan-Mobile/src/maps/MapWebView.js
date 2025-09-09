// MapWebView.js
export const getMapHtml = (permissionStatus, location, mapType) => {
  if (permissionStatus !== 'granted' || !location?.latitude || !location?.longitude) {
    return null;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        #map { height: 100%; width: 100%; }
        html, body { height: 100%; margin: 0; padding: 0; }
        .gm-fullscreen-control { display: none !important; }
      </style>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
      <script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-database-compat.js"></script>
      <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk&libraries=places"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const firebaseConfig = {
          apiKey: "AIzaSyAAAu6BeQjIZ7H7beFbAsPWuKuORmh0wrk",
          authDomain: "bayanihan-5ce7e.firebaseapp.com",
          databaseURL: "https://bayanihan-5ce7e-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "bayanihan-5ce7e",
          storageBucket: "bayanihan-5ce7e.appspot.com",
          messagingSenderId: "593123849917",
          appId: "1:593123849917:web:eb85a63a536eeff78ce9d4",
          measurementId: "G-ZTQ9VXXVV0",
        };

        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        let map;
        let activationMarkers = [];
        let nonActivationMarkers = [];
        let geocoder;
        let singleInfoWindow;
        let currentInfoWindowMarker = null;
        let isInfoWindowClicked = false;

        function initMap() {
          try {
            const userLocation = { lat: ${location.latitude}, lng: ${location.longitude} };
            map = new google.maps.Map(document.getElementById("map"), {
              center: userLocation,
              zoom: 16,
              mapTypeId: "${mapType}",
              mapTypeControl: false,
              streetViewControl: false,
              zoomControl: false,
              fullscreenControl: false,
              keyboardShortcuts: false,
              disableDefaultUI: true
            });

            geocoder = new google.maps.Geocoder();
            singleInfoWindow = new google.maps.InfoWindow();

            const userMarker = new google.maps.Marker({
              position: userLocation,
              map: map,
              title: "Your Location",
              icon: {
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              },
            });
            nonActivationMarkers.push(userMarker);

            geocoder.geocode({ location: userLocation }, (results, status) => {
              let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: ${location.latitude}, Lng: ${location.longitude}\`;
              const userInfoWindow = new google.maps.InfoWindow({
                content: infoContent,
              });
              userMarker.addListener("click", () => {
                userInfoWindow.open(map, userMarker);
              });
              userInfoWindow.open(map, userMarker);
            });

            const activationsRef = database.ref("activations").orderByChild("status").equalTo("active");
            activationsRef.on("value", (snapshot) => {
              activationMarkers.forEach(marker => marker.setMap(null));
              activationMarkers = [];

              const activations = snapshot.val();
              if (!activations) {
                return;
              }

              Object.entries(activations).forEach(([key, activation]) => {
                if (!activation.latitude || !activation.longitude) {
                  console.warn(\`Activation \${key} is missing latitude or longitude:\`, activation);
                  return;
                }

                const position = { lat: parseFloat(activation.latitude), lng: parseFloat(activation.longitude) };

                const logoPath = "https://firebasestorage.googleapis.com/v0/b/bayanihan-5ce7e.appspot.com/o/AB_logo.png?alt=media";

                const marker = new google.maps.Marker({
                  position: position,
                  map: map,
                  title: activation.organization,
                  icon: {
                    url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  },
                });

                activationMarkers.push(marker);

                const img = new Image();
                img.src = logoPath;
                img.onload = () => {
                  createInfoWindow(marker, activation, logoPath);
                };
                img.onerror = () => {
                  console.error("Failed to load logo for InfoWindow:", logoPath);
                  createInfoWindow(marker, activation, null);
                };
              });
            }, (error) => {
              console.error("Error fetching activations for map:", error);
            });

            map.addListener("click", (event) => {
              clearNonActivationMarkers();
              const marker = new google.maps.Marker({
                position: event.latLng,
                map: map,
                title: "Pinned Location",
              });
              nonActivationMarkers.push(marker);

              geocoder.geocode({ location: event.latLng }, (results, status) => {
                let infoContent = status === "OK" && results[0] ? results[0].formatted_address : \`Lat: \${event.latLng.lat()}, Lng: \${event.latLng.lng()}\`;
                const infoWindow = new google.maps.InfoWindow({
                  content: infoContent,
                });
                marker.addListener("click", () => {
                  infoWindow.open(map, marker);
                });
                infoWindow.open(map, marker);
              });

              map.setCenter(event.latLng);
              map.setZoom(16);
            });
          } catch (error) {
            console.error("Map initialization error:", error);
          }
        }

        function createInfoWindow(marker, activation, logoUrl) {
          const content = \`
            <div class="bayanihan-infowindow" style="
              font-family: 'Arial', sans-serif;
              color: #333;
              padding: 15px;
              background: #FFFFFF;
              border-radius: 10px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
              max-width: 300px;
              border-top: 5px solid #FF69B4;
              animation: slideIn 0.3s ease-out;
            ">
              <h3 style="
                margin: 0 0 10px;
                color: #007BFF;
                font-size: 18px;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                \${logoUrl ? 
                  \`<img src="\${logoUrl}" alt="Bayanihan Logo" style="width: 24px; height: 24px;" />\` : 
                  \`<span style="font-size: 24px;">🌟</span>\`
                }
                \${activation.organization}
              </h3>
              <p style="margin: 5px 0;">
                <strong style="color: #007BFF;">📍 Location:</strong>
                <span style="color: #333;">\${activation.areaOfOperation}</span>
              </p>
              <p style="margin: 5px 0;">
                <strong style="color: #007BFF;">🌍 Calamity:</strong>
                <span style="color: #333;">\${activation.calamityType}\${activation.typhoonName ? \` (\${activation.typhoonName})\` : ''}</span>
              </p>
              <p style="margin: 5px 0;">
                <strong style="color: #007BFF;">✅ Status:</strong>
                <span style="color: #388E3C; font-weight: bold;">Active</span>
              </p>
            </div>
            <style>
              @keyframes slideIn {
                0% { transform: translateY(10px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
            </style>
          \`;

          marker.addListener("mousedown", () => {
            if (isInfoWindowClicked) {
              return;
            }

            if (currentInfoWindowMarker && currentInfoWindowMarker !== marker) {
              singleInfoWindow.close();
            }

            singleInfoWindow.setContent(content);
            singleInfoWindow.open(map, marker);
            currentInfoWindowMarker = marker;
          });

          marker.addListener("mouseup", () => {
            if (isInfoWindowClicked) {
              return;
            }

            if (currentInfoWindowMarker === marker) {
              singleInfoWindow.close();
              currentInfoWindowMarker = null;
            }
          });

          marker.addListener("click", () => {
            if (currentInfoWindowMarker && currentInfoWindowMarker !== marker) {
              singleInfoWindow.close();
            }

            singleInfoWindow.setContent(content);
            singleInfoWindow.open(map, marker);
            currentInfoWindowMarker = marker;
            isInfoWindowClicked = true;
          });

          singleInfoWindow.addListener("closeclick", () => {
            isInfoWindowClicked = false;
            currentInfoWindowMarker = null;
          });
        }

        function clearNonActivationMarkers() {
          nonActivationMarkers.forEach(marker => marker.setMap(null));
          nonActivationMarkers = [];
        }

        window.initMap = initMap;
        initMap();
      </script>
    </body>
    </html>
  `;
};