# To-Do & Training Event Planner

**One app for tasks, workouts, spending, and life.**  
A personal dashboard to plan your day, track workouts, manage money, and log books, movies, and language learning — all in one place.

---

## What’s inside

| Area | What you get |
|------|----------------|
| **Dashboard** | Draggable widgets, water tracker, quick overview of your day |
| **Daily tasks** | Date-based to-dos and “whenever” tasks with check-offs |
| **Spending** | Track expenses with category, amount, and optional receipt |
| **Workout history** | Log exercises (sets, reps, weight), view past sessions |
| **Library** | Books you’ve read with title, review, and rating |
| **Cinema** | Movies you’ve watched with review and rating |
| **Language learning** | Track progress and notes for language practice |

Protected routes and a simple login flow keep your data scoped to your session (auth is in-memory/localStorage for this demo).

---

## Tech stack

- **React 18** + **TypeScript**
- **Vite 6** — dev server and builds
- **React Router 7** — routing and protected routes
- **Tailwind CSS 4** — styling
- **Radix UI** + **shadcn-style** components — accessible UI (dialogs, sheets, forms, etc.)
- **Motion** — animations
- **React Hook Form** — forms
- **Recharts** — charts (e.g. spending)
- **date-fns** — dates

---

## Project structure

```
src/
├── app/
│   ├── App.tsx              # App root, router, toaster
│   ├── routes.tsx           # Route definitions + protected route wrapper
│   ├── context/
│   │   └── AppContext.tsx   # Global state (workouts, water, todos, spending, library, cinema)
│   ├── screens/             # Page-level components
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DailyTasks.tsx
│   │   ├── EventsList.tsx   # Workout history
│   │   ├── Spending.tsx
│   │   ├── Library.tsx
│   │   ├── Cinema.tsx
│   │   └── LanguageLearning.tsx
│   └── components/          # Shared UI + feature components
│       ├── Layout.tsx       # Shell, nav, sidebar
│       ├── ui/              # Base UI (button, card, dialog, etc.)
│       ├── DailyTodoList.tsx
│       ├── WheneverTodoList.tsx
│       ├── WaterTracker.tsx
│       ├── SpendingTracker.tsx
│       ├── DraggableDashboardItem.tsx
│       └── ...
├── main.tsx
└── styles/
```

---

## Getting started

**Requirements:** Node.js 18+ and npm (or pnpm).

```bash
# Install dependencies
npm install

# Run development server (default: http://localhost:5173)
npm run dev

# Production build
npm run build
```

After `npm run dev`, open the app, sign in (any email/password works in this demo), and use the sidebar to jump between Dashboard, Daily Tasks, Spending, Library, Cinema, Language Learning, and Workout History.

---

## Design & assets

- **Figma design:** [To-Do & Training Event Planner](https://www.figma.com/design/49I05fz3YJwHJ40EM9cWWN/To-Do---Training-Event-Planner)  
- **UI components:** [shadcn/ui](https://ui.shadcn.com/) (MIT)  
- **Photos:** [Unsplash](https://unsplash.com) (see [license](https://unsplash.com/license))  

More details: [ATTRIBUTIONS.md](./ATTRIBUTIONS.md).

---

## License

Private project. See repository and Figma/shadcn/Unsplash attributions for third-party terms.
