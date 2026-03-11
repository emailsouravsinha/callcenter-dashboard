# RPAClick Dashboard

A Next.js dashboard application that connects to AWS Lightsail MySQL database to display business metrics and data.

## Features

- Real-time database connectivity status
- Dashboard metrics (Users, Projects, Revenue)
- Responsive design with Tailwind CSS
- TypeScript support
- Health check API endpoint

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure database connection:**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your AWS Lightsail MySQL credentials:
   ```
   DB_HOST=your-lightsail-ip
   DB_PORT=3306
   DB_USER=your-username
   DB_PASSWORD=your-password
   DB_NAME=your-database-name
   ```

3. **Database Schema:**
   Ensure your MySQL database has these tables:
   ```sql
   CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
   CREATE TABLE projects (id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(255), status VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
   CREATE TABLE revenue (id INT PRIMARY KEY AUTO_INCREMENT, amount DECIMAL(10,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## API Endpoints

- `/api/health` - Database connection health check
- `/api/data` - Dashboard metrics data

## Tech Stack

- **Framework:** Next.js 16.1.1 with App Router
- **Database:** MySQL with mysql2 driver
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Language:** TypeScript

## Development

The dashboard runs on port 3001 to avoid conflicts with other Next.js applications.

To customize the dashboard:
1. Modify queries in `src/app/api/data/route.ts`
2. Update UI components in `src/app/page.tsx`
3. Adjust database schema in `src/lib/database.ts`