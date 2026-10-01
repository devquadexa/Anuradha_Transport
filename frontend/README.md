# Anuradha TMS - Frontend

React admin dashboard for the Transport Management System. Communicates
with the backend exclusively via REST APIs (`src/services/apiClient.js`) -
never touches the database directly. All business logic stays in the
backend; this project is presentation and interaction only.

## Stack
React 19, Vite, Material UI, React Router, Axios, React Hook Form + Joi,
TanStack Query, notistack (notifications).

## Structure (feature-based)

```
src/
├── app/            AppRouter
├── features/
│   ├── auth/         login page, unauthorized page, authApi
│   ├── users/        list page, form dialog, hooks (TanStack Query), usersApi
│   └── dashboard/    overview page
├── components/      shared DataTable, ConfirmDialog, etc.
├── layouts/          DashboardLayout (app bar, drawer nav, dark mode)
├── contexts/          AuthContext, ThemeModeContext
├── routes/            ProtectedRoute, navConfig
├── services/          apiClient (axios + JWT/refresh interceptors), queryClient
├── theme/              MUI theme factory (light/dark)
└── utils/              tokenStorage
```

## Setup

```bash
cp .env.example .env
# set VITE_API_BASE_URL to your backend URL
npm install
npm run dev
```

## Auth & RBAC
- `AuthContext` holds the current user (from `GET /auth/me`), login/logout,
  and `hasRole`/`hasPermission` helpers.
- `apiClient` attaches the JWT access token to every request and
  transparently refreshes it on 401 using the stored refresh token,
  queuing concurrent requests during the refresh.
- `ProtectedRoute` guards routes by authentication, and optionally by
  role/permission (`roles=[]`, `permissions=[]` props).
- `navConfig` + `DashboardLayout` filter sidebar items by permission so
  navigation reflects what the logged-in user can actually access.

## Module 1: Users
`/users` page demonstrates the reusable pattern for future modules:
generic `DataTable` (server pagination/sort), `UserFormDialog`
(create/edit via React Hook Form + Joi), `ConfirmDialog` for delete, and
TanStack Query hooks (`useUsersList`, `useCreateUser`, `useUpdateUser`,
`useDeleteUser`) wrapping `usersApi`.

## Scripts
- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run lint` - oxlint
- `npm run preview` - preview production build

## Adding the next module
1. `src/features/<module>/api/<module>Api.js` - axios calls
2. `src/features/<module>/hooks/use<Module>.js` - TanStack Query wrappers
3. `src/features/<module>/pages/<Module>ListPage.jsx` + form dialog/component
4. Add route in `src/app/AppRouter.jsx`, nav entry in `src/routes/navConfig.js`
