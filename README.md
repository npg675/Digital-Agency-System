# LandingForge Documentation

## 1. Database Configuration

LandingForge is built using SQLAlchemy as the ORM (Object-Relational Mapper). This means the database is completely abstracted and can easily be switched.

### Local Development (SQLite)
Currently, the system is configured to use **SQLite** for instant local testing without any external dependencies.
- **Connection String:** `sqlite:///./landingforge.db`
- **Location:** The database is automatically created as a file named `landingforge.db` inside the `/backend` folder when you start the server.
- **Auto-Creation:** In `backend/app/main.py`, the code `Base.metadata.create_all(bind=engine)` automatically creates all the necessary tables (`users`, `templates`, `landing_pages`, etc.) if they don't exist.

### Production (PostgreSQL & Docker)
When you are ready to deploy or use Docker:
1. Open `backend/app/core/config.py`.
2. Change the `DATABASE_URL` back to PostgreSQL: `postgresql://landingforge:password@postgres:5432/landingforge_dev`
3. The included `docker-compose.yml` will automatically spin up a dedicated PostgreSQL container and connect it to your backend.

---

## 2. Running the Project Locally

If you need to start the project manually, open two separate terminal windows in your project root (`d:\AI projects Cursor\Landing Page Builder`).

### Start the Backend (FastAPI)
```powershell
cd backend
# 1. Activate the virtual environment
.\venv\Scripts\Activate.ps1

# 2. Run the initialization script (creates the admin user)
python init_db.py

# 3. Start the server
uvicorn app.main:app --reload --port 8000
```
*The backend API will be running at http://localhost:8000*
*You can view the interactive API documentation at http://localhost:8000/docs*

### Start the Frontend (Next.js)
```powershell
cd frontend
# Start the development server
npm run dev
```
*The frontend will be running at http://localhost:3000*

---

## 3. The Login Process

The application uses **JWT (JSON Web Tokens)** for secure, stateless authentication.

1. **Database Initialization:** When `python init_db.py` is run, it securely hashes the password `admin123` using `bcrypt` and inserts the user `admin@landingforge.com` into the SQLite database.
2. **Frontend Submission:** When you enter the credentials at `http://localhost:3000/admin/login`, the frontend sends a `POST` request to `/api/v1/auth/login`.
3. **Backend Verification:** The FastAPI backend receives the request, finds the user by email, and verifies the password against the stored bcrypt hash.
4. **Token Generation:** If successful, the backend generates a JWT (signed with a secret key) and sends it back to the frontend.
5. **State Management:** The frontend takes this token and saves it securely in the browser's `localStorage` using our Zustand state manager (`useAuthStore`).
6. **Authenticated Requests:** For all subsequent requests (like fetching the dashboard data), the frontend automatically attaches this token to the `Authorization: Bearer <token>` HTTP header, proving to the backend that you are logged in!

---

## 4. Platform Features
We have built a fully-featured, production-ready Digital Marketing Agency platform.

### Page Builder & Editor
- **Live Preview Canvas:** See changes in real-time.
- **Drag-and-Drop:** Intuitive reordering of sections directly on the visual canvas.
- **9 Customizable Components:** Hero, Features, Stats, About, Gallery, Testimonials, Contact Forms, Video, and Socials.
- **Global Page Settings:** Easily inject Custom CSS/JS, SEO Meta Tags, and tracking pixels (Facebook, TikTok, GA4, GTM).

### Templates & Personalization
- Save any page as a reusable Template.
- **AI-Powered Personalization:** When creating a page from a template, select an "Industry". If an OpenAI API Key is provided, the platform will utilize generative AI to rewrite the entire landing page text for that specific niche.
- **Graceful Fallback:** If no AI key is provided, the system falls back to a lightning-fast deterministic keyword substitution engine.

### CRM & Analytics
- **Lead Capture:** Form submissions automatically flow into the CRM inbox.
- **Analytics Dashboard:** Visual tracking of Page Views, Unique Visitors, and Leads generated per page over time.

### Multi-Tenant Agency Management (RBAC)
- **ADMIN:** Full platform access to create templates, manage users, and view all data.
- **STAFF:** Can create and edit landing pages for clients, but cannot manage users.
- **CLIENT:** Read-only access to their specifically assigned landing pages, leads, and analytics.
- **Custom Domains:** Support for white-labeled custom domains. Next.js Edge Middleware dynamically routes client domains (e.g. `promo.client.com`) to the correct landing page without exposing the agency URL!
