# PWA (Progressive Web App) Implementation

This document describes the PWA features implemented in the AWOS Dashboard application.

## Features Implemented

### 1. App Manifest (`/public/manifest.json`)

- Defines app metadata for installation
- Icons for different device sizes
- Display mode set to "standalone"
- Theme colors configured

### 2. Service Worker (`/public/sw.js`)

- Caches critical resources for offline access
- Implements cache-first strategy for API requests
- Provides offline fallback pages
- Handles background sync for data updates
- Supports push notifications (optional)

### 3. Offline Support

- **Cached Resources**: Pages, stylesheets, JavaScript, and images
- **API Caching**: Weather data and system status cached locally
- **Offline Fallback**: Custom offline page when network unavailable
- **Storage Management**: LocalStorage for persistent data

### 4. Components Added

#### PWA Connection Status (`/components/pwa-connection-status.tsx`)

- Shows online/offline status
- Displays offline notification banner
- Registers service worker automatically

#### PWA Install Prompt (`/components/pwa-install-prompt.tsx`)

- Shows installation prompt for supported browsers
- Handles beforeinstallprompt event
- Provides native app-like installation experience

#### Offline Storage Hook (`/hooks/use-offline-storage.ts`)

- Custom hook for offline data management
- API response caching with timestamps
- Storage usage monitoring

### 5. Enhanced API Client (`/lib/pwa-api-client.ts`)

- Network-first strategy with cache fallback
- Automatic caching of successful responses
- Offline detection and handling

## How It Works

### Installation

1. Users visit the site on supported browsers
2. Browser shows "Install App" banner or prompt
3. After installation, app opens in standalone mode
4. App icon appears on device home screen/desktop

### Offline Functionality

1. **First Visit**: Service worker caches essential resources
2. **Subsequent Visits**: Cached resources load instantly
3. **Offline Mode**: App continues to work with cached data
4. **Network Recovery**: Automatically syncs when connection restored

### Cache Strategy

- **Static Assets**: Cache-first (HTML, CSS, JS, images)
- **API Data**: Network-first with cache fallback
- **Navigation**: Cache-first with network update

## Browser Support

### Full PWA Support

- Chrome/Chromium (Android, Desktop)
- Edge (Windows, Android)
- Samsung Internet
- Opera

### Partial Support

- Safari (iOS/macOS) - Web App Manifest support
- Firefox - Service Worker support

## Installation Instructions

### For Users

1. **Chrome/Edge Desktop**: Click install icon in address bar
2. **Chrome Android**: "Add to Home Screen" from menu
3. **iOS Safari**: Share button → "Add to Home Screen"

### For Developers

1. Ensure HTTPS (required for service workers)
2. Icons must be served from same origin
3. Manifest.json must be accessible
4. Test with Chrome DevTools → Application → PWA

## Files Structure

```
public/
├── manifest.json          # App manifest
├── sw.js                 # Service worker
├── favicon.ico           # Favicon
└── icons/                # PWA icons
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-192x192.png
    └── ... (various sizes)

components/
├── pwa-connection-status.tsx   # Online/offline indicator
└── pwa-install-prompt.tsx      # Installation prompt

hooks/
└── use-offline-storage.ts      # Offline data management

lib/
└── pwa-api-client.ts          # Enhanced API client

app/
└── offline/
    └── page.tsx               # Offline fallback page
```

## Configuration

### Next.js Config (`next.config.mjs`)

```javascript
import withPWA from "next-pwa";

const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  sw: "sw.js",
});
```

### Customization Options

#### Cache Duration

Edit service worker cache names and expiration:

```javascript
const CACHE_NAME = "awos-dashboard-v1";
// Update version to force cache refresh
```

#### Offline Behavior

Modify `/app/offline/page.tsx` for custom offline experience.

#### Icons

Replace icons in `/public/icons/` with custom designs.
Use `npm run generate-icons` to create placeholder SVGs.

## Performance Benefits

1. **Faster Loading**: Cached resources load instantly
2. **Offline Access**: Core functionality works without network
3. **Reduced Bandwidth**: Cached resources reduce data usage
4. **Native Feel**: Standalone mode removes browser UI

## Security Considerations

1. **HTTPS Required**: Service workers only work over HTTPS
2. **Same-Origin**: Icons and manifest must be same domain
3. **Cache Management**: Implement cache versioning for updates
4. **Data Privacy**: Sensitive data should not be cached

## Testing

### Chrome DevTools

1. Open DevTools → Application tab
2. Check Service Workers registration
3. Test offline mode in Network tab
4. Audit with Lighthouse PWA score

### Manual Testing

1. Install app from browser
2. Turn off network connection
3. Verify offline functionality
4. Test installation on different devices

## Troubleshooting

### Service Worker Not Registering

- Check HTTPS requirement
- Verify file path `/public/sw.js`
- Check console for errors

### Icons Not Showing

- Verify icon files exist in `/public/icons/`
- Check manifest.json paths
- Ensure proper MIME types

### Cache Issues

- Update cache version in service worker
- Use "Clear Storage" in DevTools
- Hard refresh (Ctrl+Shift+R)

## Future Enhancements

1. **Background Sync**: Sync data when connection restored
2. **Push Notifications**: Weather alerts and updates
3. **Offline Forms**: Queue form submissions for later sync
4. **Advanced Caching**: Predictive prefetching
5. **Update Notifications**: Alert users of new app versions

## Monitoring

Track PWA metrics:

- Installation rates
- Offline usage
- Cache hit ratios
- User engagement
- Performance improvements

---

For technical support or questions about PWA implementation, refer to the main documentation or contact the development team.
