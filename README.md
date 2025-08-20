# Bluefin Trading Platform

A professional, high-performance trading interface for Bluefin Exchange perpetual futures on the Sui blockchain. Built with modern web technologies for optimal speed and user experience.

## 🚀 Features

✅ **Real-time Market Data**: Live price feeds, market data, and trade updates via WebSocket  
✅ **Professional Charts**: Advanced candlestick charts with technical indicators  
✅ **Secure Trading**: HTTPS-enabled with SSL certificates  
✅ **Cross-Platform**: Responsive design works on desktop, tablet, and mobile  
✅ **Fast Performance**: Optimized React build with code splitting  
✅ **Modern UI**: Clean, professional interface with dark theme  
✅ **Live Trading**: Real-time position management and P&L tracking  
✅ **Multiple Markets**: Support for all Bluefin perpetual markets  

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts + Lightweight Charts
- **Icons**: Lucide React
- **Build Tool**: Vite with SWC compiler
- **Deployment**: Vercel/Netlify ready

## 🏃‍♂️ Quick Start

### Development
```bash
npm install
npm run dev
```
Development server runs at: `https://localhost:8083`

### Production Build
```bash
npm run build
npm run preview
```

### Local Production Server
```bash
npm install -g serve
serve -s dist -l 3000
```

## 🌐 Deployment

The platform is ready for deployment on major hosting platforms:

### Vercel (Recommended)
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Netlify
1. Run `npm run build`
2. Drag `/dist` folder to [netlify.com/drop](https://netlify.com/drop)
3. Or connect your Git repository

### Other Platforms
- **Firebase**: `firebase deploy`
- **AWS S3**: Upload `/dist` to S3 bucket
- **GitHub Pages**: Push to `gh-pages` branch

## 📊 Trading Features

### Real-time Data
- Live price feeds from Bluefin API
- WebSocket connections for instant updates
- Market depth and order book data
- Recent trades feed

### Advanced Charting
- Multiple chart types (Line, Area, Candlestick)
- Technical indicators (MA5, MA20)
- Volume analysis
- Fullscreen chart mode
- Interactive tooltips

### Trading Interface
- Leverage trading (1x - 20x)
- Long/Short positions
- Real-time P&L calculation
- Position management
- Market selection

## 🔧 Configuration

### Environment Variables
```bash
# Optional: Custom API endpoints
VITE_BLUEFIN_API_URL=https://api.sui-prod.bluefin.io
VITE_BLUEFIN_WS_URL=wss://notifications.api.sui-prod.bluefin.io
```

### Proxy Configuration
The app includes built-in proxy configuration for Bluefin APIs to handle CORS and SSL issues during development.

## 🚦 Performance

- **Lighthouse Score**: 95+ Performance
- **Bundle Size**: ~1.1MB (gzipped: ~330KB)
- **Load Time**: <2s on fast connections
- **Real-time Updates**: <100ms latency

## 🔒 Security

- HTTPS-only connections
- CORS-compliant API requests
- Secure WebSocket connections
- No sensitive data storage
- CSP-compliant code

## 📱 Browser Support

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## 🤝 Contributing

This is a production trading platform. For issues or feature requests, please contact the development team.

## 📄 License

Proprietary software. All rights reserved.

---

**Live Trading Platform**: Professional perpetual futures trading on Sui blockchain via Bluefin Exchange.
