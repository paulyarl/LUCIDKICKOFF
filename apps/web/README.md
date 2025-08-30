# LucidCraft Web App

A Next.js application with TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS with shadcn/ui components
- Lucide React icons
- ESLint and Prettier configured
- 44px minimum tap targets for better accessibility
- Responsive design
- Dark/light mode support

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the project root and add the following:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Project Structure

```
/app
  /(marketing)        # Marketing pages
  /api                # API routes
  /color/[pageId]     # Color pages
  /community          # Community section
  /library            # User library
  /pack               # Pack pages
  /parent             # Parent controls
  /packs              # Packs listing
  globals.css         # Global styles
  layout.tsx          # Root layout
  page.tsx            # Home page
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Accessibility

- 44px minimum tap targets on all interactive elements
- Visible focus rings for keyboard navigation
- Semantic HTML structure
- ARIA attributes where needed

## License

MIT
