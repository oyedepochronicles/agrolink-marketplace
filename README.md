# PhyhanAgro Marketplace — Client

A modern, responsive React + TypeScript marketplace frontend for buying fresh produce directly from verified Nigerian farmers.

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ or **Bun** (recommended for faster package management)
- **npm** or **bun**

### Installation

```bash
cd client

# Using npm
npm install

# Or using Bun
bun install
```

### Environment Variables

Create a `.env.local` file in the client directory:

```env
VITE_API_URL=http://localhost:5000
VITE_BASE_URL=https://agrolink-marketplace.vercel.app
```

### Development Server

```bash
# Using npm
npm run dev

# Using Bun
bun run dev
```

The app will be available at `http://localhost:8080`.

### Build for Production

```bash
# Using npm
npm run build

# Using Bun
bun run build
```

## 📁 Project Structure

```
client/
├── public/               # Static assets
│   ├── favicon.ico       # Marketplace logo favicon
│   ├── llms.txt          # AI assistant info file
│   ├── og-image.svg      # Social share preview image
│   ├── sitemap.xml       # SEO sitemap
│   └── robots.txt        # Search engine directives
├── src/
│   ├── assets/           # Images, logos, media files
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Shadcn UI components
│   │   ├── auth/         # Authentication components
│   │   ├── chat/         # Messaging components
│   │   ├── dashboard/    # Dashboard layouts
│   │   ├── marketplace/  # Marketplace-specific components
│   │   └── profile/      # Profile/account components
│   ├── contexts/         # React Context providers
│   │   └── AuthContext   # Authentication state
│   ├── hooks/            # Custom React hooks
│   │   ├── usePageMeta   # Dynamic SEO metadata hook
│   │   ├── useProducts   # Product data fetching
│   │   ├── useCart       # Shopping cart management
│   │   ├── useOrders     # Order management
│   │   └── ...           # Other domain hooks
│   ├── i18n/             # Internationalization
│   ├── lib/              # Utility functions
│   │   ├── api.ts        # Axios API client
│   │   ├── format.ts     # Formatting utilities
│   │   ├── socket.ts     # Socket.IO configuration
│   │   └── utils.ts      # General utilities
│   ├── pages/            # Page components (by feature)
│   │   ├── auth/         # Login, register, password reset
│   │   ├── marketplace/  # Product listings, cart, checkout
│   │   ├── dashboard/    # Farmer, rider, admin dashboards
│   │   └── Index.tsx     # Home page
│   ├── types/            # TypeScript interfaces & types
│   ├── App.tsx           # Main app component & routing
│   ├── main.tsx          # Vite entry point
│   └── index.css         # Global styles
├── index.html            # HTML template with SEO
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS config
├── tsconfig.json         # TypeScript config
└── package.json          # Dependencies & scripts
```

## 🛠 Key Technologies

- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool & dev server
- **TailwindCSS** — Utility-first CSS
- **Shadcn UI** — Component library
- **React Router DOM** — Client-side routing
- **Axios** — HTTP client
- **TanStack React Query** — Data fetching & caching
- **Socket.IO Client** — Real-time messaging
- **Capacitor** — Mobile app wrapper (Android)
- **Vitest** — Unit testing

## 📖 Feature Overview

### Marketplace

- Browse fresh produce from verified farmers
- Filter by category, location, and availability
- View detailed product info with farmer profiles
- Real-time chat with sellers
- Shopping cart & checkout
- Order tracking

### User Roles

- **Buyers** — Purchase produce and manage orders
- **Farmers** — List products, manage inventory, track sales
- **Riders** — Accept delivery tasks and earn commissions
- **Admins** — Manage users, verify sellers, handle disputes

### Authentication

- Email/phone sign-up and login
- OTP verification
- Password reset
- Role-based access control
- Persistent sessions with JWT

### Real-time Features

- Live chat with farmers/support
- Push notifications
- Order status updates
- Delivery tracking

## 🎨 SEO & Social Sharing

The client includes comprehensive SEO support:

- **Dynamic page metadata** via `usePageMeta` hook
- **JSON-LD structured data** for products and FAQs
- **Absolute URLs** for canonical links and OG images
- **Sitemap** at `/sitemap.xml`
- **Robots** configuration at `/robots.txt`
- **LLM info** at `/llms.txt` for AI assistants

See `src/hooks/usePageMeta.ts` for implementation details.

## 🚢 Deployment

The client is configured for **Vercel** deployment:

1. Push your code to GitHub
2. Connect the repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

See `vercel.json` for Vercel routing configuration.

## 📱 Mobile Development

The app includes **Capacitor** for building Android apps:

```bash
# Build and sync with Android
npm run build
npx cap add android
npx cap copy
npx cap open android
```

## 🧪 Testing

```bash
# Run tests once
npm run test

# Watch mode
npm run test:watch
```

## 🔍 Code Quality

```bash
# Lint code
npm run lint

# Format code (configure in your editor)
# Uses ESLint + Prettier
```

## 📚 API Integration

The client communicates with the backend via `/lib/api.ts`:

```typescript
import { api } from "@/lib/api";

// Example: Fetch products
const { data } = await api.get("/products", { params: { category: "vegetables" } });

// Example: Create order
await api.post("/orders", { items: [...], deliveryAddress: {...} });
```

## 🔐 Authentication

Authentication state is managed via `AuthContext`:

```typescript
import { useAuth } from "@/contexts/AuthContext";

const { user, login, logout, isLoading } = useAuth();
```

## 🐛 Common Issues

**Port already in use:**

```bash
npm run dev -- --port 3000
```

**Module not found errors:**

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`

**Build fails:**

- Check TypeScript errors: `npx tsc --noEmit`
- Review console output for specific errors

## 📞 Support

For issues or questions:

1. Check `src/pages/marketplace/Support.tsx` for in-app support
2. Review API endpoints in `server/ENDPOINTS.md`
3. Contact the development team

## 📄 License

PhyhanAgro © 2026. All rights reserved.
