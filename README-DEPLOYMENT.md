# Bereitstellung der Airbnb-Form Anwendung auf dem Hetzner-Server

Diese Dokumentation beschreibt, wie die Anwendung auf dem Hetzner-Server bereitgestellt wird und welche Konfigurationen erforderlich sind.

## Serverstruktur

Die Anwendung besteht aus zwei Teilen:
- **Frontend**: Eine React-Anwendung
- **Backend**: Ein Node.js-Server mit Express

Auf dem Hetzner-Server befindet sich die Anwendung im Verzeichnis:
```
/var/www/airbnbform
```

## Konfiguration des Webservers (nginx)

Der Server sollte mit nginx wie folgt konfiguriert werden:

```nginx
server {
    listen 80;
    server_name 65.109.228.106; # IP-Adresse oder Domain

    # Frontend (statische Dateien)
    location / {
        root /var/www/airbnbform/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Diese Konfiguration leitet alle Anfragen an `/api/*` an den Backend-Server auf Port 3001 weiter.

## Deployment-Prozess

1. **Code aktualisieren:**
   ```bash
   cd /var/www/airbnbform
   git pull origin main
   ```

2. **Backend aktualisieren:**
   ```bash
   cd /var/www/airbnbform/backend
   npm install
   pm2 restart airbnbform-backend # oder den Namen deines PM2-Prozesses
   ```

3. **Frontend bauen:**
   ```bash
   cd /var/www/airbnbform/frontend
   npm install
   npm run build
   ```

## Erste Einrichtung

Bei der ersten Einrichtung müssen folgende Schritte durchgeführt werden:

1. **Repository klonen:**
   ```bash
   cd /var/www
   git clone https://github.com/dein-repo/airbnbform.git
   ```

2. **Backend einrichten:**
   ```bash
   cd /var/www/airbnbform/backend
   npm install
   # Backend mit PM2 starten (empfohlen für Produktionsumgebungen)
   pm2 start src/server.js --name airbnbform-backend
   ```

3. **Frontend bauen:**
   ```bash
   cd /var/www/airbnbform/frontend
   npm install
   npm run build
   ```

4. **nginx konfigurieren und neustarten:**
   ```bash
   # Konfigurationsdatei erstellen
   nano /etc/nginx/sites-available/airbnbform

   # Symbolischen Link erstellen
   ln -s /etc/nginx/sites-available/airbnbform /etc/nginx/sites-enabled/

   # nginx neustarten
   systemctl restart nginx
   ```

## Fehlerbehebung

- **Backend läuft nicht:** Überprüfe den Status des Backends mit `pm2 status`
- **Zugriff auf Frontend funktioniert nicht:** Überprüfe die nginx-Konfiguration und -Logs
- **API-Anfragen schlagen fehl:** Überprüfe die CORS-Konfiguration im Backend und die Proxy-Konfiguration in nginx

## Wichtige Dateien

- **Backend-Konfiguration:** `/var/www/airbnbform/backend/src/server.js`
- **Frontend-Konfiguration:** `/var/www/airbnbform/frontend/src/config.js`
- **nginx-Konfiguration:** `/etc/nginx/sites-available/airbnbform`
- **PM2-Prozesse:** Überprüfen mit `pm2 status` 