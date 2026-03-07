# Coventry Celebkids - First Day Registration

Use this app to register children on the first day and view the live list of registered children. It stores records in Supabase when configured, and falls back to local storage when not.

## Supabase setup

1. Create a Supabase project.
2. Create a `children` table with the columns below.
3. Add a `.env.local` file in the project root with your keys:

```
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Deploy with GitHub Actions (GitHub Pages)

This repo includes a workflow in `.github/workflows/deploy.yml` that builds and deploys the app to GitHub Pages on pushes to `main`.

1. In GitHub, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Add the following repository secrets (**Settings → Secrets and variables → Actions**):

```
REACT_APP_SUPABASE_URL=your-project-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

3. Push to `main` (or run the workflow manually). The app will deploy to the Pages URL shown in the workflow summary.

### Suggested `children` table schema

| Column | Type | Notes |
| --- | --- | --- |
| id | text | Primary key (UUID or text) |
| name | text | Child name |
| age | text | Optional |
| date_of_birth | date | Optional |
| guardian_name | text | Parent/guardian name |
| guardian_contact | text | Phone or contact |
| allergies | text | Optional |
| class_category | text | TenderFoot, Lighttroopers, Tribe of Truth |
| last_status | text | sign_in or sign_out |
| last_action_at | timestamptz | Last sign in/out time |
| allow_photos | boolean | Photo consent |
| notes | text | Optional notes |
| created_at | timestamptz | Defaults to now() |

### SQL to add the new columns

If you already created the `children` table, run this in Supabase SQL editor:

```
alter table public.children
	add column if not exists date_of_birth date,
	add column if not exists guardian_name text,
	add column if not exists guardian_contact text,
	add column if not exists allergies text,
	add column if not exists class_category text,
	add column if not exists last_status text,
	add column if not exists last_action_at timestamptz,
	add column if not exists allow_photos boolean default false;

### Check-in/out table

Create a `checkins` table to record drop-off and pickup actions:

```
create table if not exists public.checkins (
  id text primary key,
  child_id text references public.children(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

alter table public.checkins enable row level security;

create policy "Allow anon checkin read"
on public.checkins
for select
to anon
using (true);

create policy "Allow anon checkin insert"
on public.checkins
for insert
to anon
with check (true);
```
```

## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
