
# FindIt Frontend

A front-end application for the FindIt project, built with modern web technologies.

## Getting Started

### Prerequisites
- Node.js (v22.22.0)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The application will run on `http://localhost:5173`

## Project Structure

```
FindIt_frontend/
│
├─ guidelines/
├─ node_modules/
│
├─ src/
│   ├─ components/
│   │   ├─ figma/
│   │   ├─ ui/
│   │   ├─ ChatMessage.tsx
│   │   ├─ Navbar.tsx
│   │   ├─ ReportCard.tsx
│   │   ├─ SightingCard.tsx
│   │   ├─ StatusConfirmationModal.tsx
│   │   └─ UploadFoundItemModal.tsx
│   │
│   ├─ pages/
│   │   ├─ Home.tsx
│   │   ├─ Login.tsx
│   │   ├─ Register.tsx
│   │   ├─ ReportDetail.tsx
│   │   ├─ Settings.tsx
│   │   └─ ReportLostItem.tsx
│   │
│   ├─ imports/
│   │   ├─ findit-homepage-design.txt
│   │   ├─ findit-ui-flow.md
│   │   ├─ report-detail-page.tsx
│   │   └─ report-lost-item.tsx
│   │
│   ├─ styles/
│   │   ├─ fonts.css
│   │   ├─ index.css
│   │   ├─ tailwind.css
│   │   └─ theme.css
│   │
│   ├─ App.tsx
│   ├─ routes.tsx
│   └─ main.tsx
│
├─ index.html
├─ package.json
├─ vite.config.ts
└─ README.md
```

## Available Scripts

- `npm start` - Start the development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm run dev` - Run with development mode

## Technologies Used

- React
- Axios (for API calls)
- CSS/SCSS

## Contributing

Please follow the project's code style and submit pull requests to the main branch.

## License

See LICENSE file in the project root.
