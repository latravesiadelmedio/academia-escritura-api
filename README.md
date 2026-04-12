# La Travesía del Medio — API

Backend REST para la plataforma educativa de escritura creativa de Gabriela Merlo. Gestiona autenticación, cursos, estudiantes, archivos y artículos.

**Frontend:** [academia-escritura](https://github.com/SaigonTourist/academia-escritura) — desplegado en Vercel  
**API en producción:** Render

---

## Stack

- **Node.js + Express 5**
- **MongoDB Atlas** con Mongoose 9
- **JWT** — tokens de 7 días
- **bcryptjs** — hasheo de contraseñas
- **Nodemailer** — emails de recuperación de contraseña (Gmail SMTP)
- **Multer** — subida de archivos de curso
- **adm-zip** — descarga de archivos comprimidos
- **express-rate-limit** — protección en endpoints de auth

---

## Instalación

```bash
npm install
cp .env.example .env   # completar variables
npm run dev            # nodemon, puerto 4000
```

### Scripts disponibles

```bash
npm start              # producción
npm run dev            # desarrollo con nodemon
node scripts/crear-admin.js   # crea el usuario admin inicial (requiere .env)
```

---

## Variables de entorno

```env
PORT=4000
MONGODB_URI=mongodb+srv://<usuario>:<password>@cluster.mongodb.net/<db>
JWT_SECRET=<string-aleatorio-largo>
FRONTEND_URL=https://academia-escritura.vercel.app

# Email — Gmail con App Password (no la contraseña real de la cuenta)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=ejemplo@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

> Para obtener un App Password de Gmail: Cuenta de Google → Seguridad → Verificación en dos pasos → Contraseñas de aplicación.

---

## Estructura

```
src/
├── middleware/
│   └── auth.js           # protect (JWT), adminOnly
├── models/
│   ├── Article.js
│   ├── Course.js
│   ├── CourseFile.js
│   └── User.js
├── routes/
│   ├── articles.js
│   ├── auth.js
│   ├── courses.js
│   ├── files.js
│   ├── upload.js
│   └── users.js
├── utils/
│   └── email.js          # sendPasswordResetEmail()
└── index.js
scripts/
└── crear-admin.js        # seed del usuario administrador
uploads/                  # archivos de cursos (gitignoreado)
```

---

## Modelos

### User
| Campo | Tipo | Notas |
|-------|------|-------|
| `name` | String | Requerido |
| `email` | String | Único, requerido |
| `password` | String | Hash bcrypt |
| `isAdmin` | Boolean | Default: false |
| `enrolledCourses` | [ObjectId] | Cursos con acceso habilitado |
| `completedCourses` | [ObjectId] | Cursos certificados (bloquea el iframe) |
| `passwordResetToken` | String | Hash SHA-256, null tras uso |
| `passwordResetExpires` | Date | 1 hora desde emisión |

### Course
| Campo | Tipo | Notas |
|-------|------|-------|
| `title` | String | Requerido |
| `description` | String | Resumen corto |
| `detailedDescription` | String | Texto largo para la página de detalle |
| `level` | String | Ej: "Principiante" |
| `duration` | String | Ej: "14 semanas" |
| `price` | String | Ej: "$45.000" |
| `objectives` | [String] | Lista de objetivos |
| `modules` | [{ title, duration }] | Contenido del programa |
| `includes` | [String] | Qué incluye el curso |
| `startDates` | [{ date, label }] | Fechas de inicio (las pasadas se filtran en endpoints públicos) |
| `contentUrl` | String | URL del iframe (Genially u otro) |

### Article
| Campo | Tipo | Notas |
|-------|------|-------|
| `title` | String | Requerido |
| `description` | String | Texto completo del disparador, requerido |
| `published` | Boolean | Default: true |

### CourseFile
| Campo | Tipo |
|-------|------|
| `courseId` | ObjectId ref Course |
| `filename` | String (nombre en disco) |
| `originalName` | String |
| `mimeType` | String |
| `size` | Number |

---

## Endpoints

### Auth — `/api/auth`
> Rate limit: 20 intentos / 15 minutos

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/login` | Público | Devuelve JWT + datos del usuario |
| GET | `/me` | JWT | Devuelve usuario autenticado actualizado |
| POST | `/forgot-password` | Público | Genera token y envía email de recuperación |
| POST | `/reset-password/:token` | Público | Valida token y actualiza contraseña |

### Courses — `/api/courses`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/` | Público | Lista cursos (filtra `startDates` vencidas) |
| GET | `/:id` | Público | Detalle de un curso (filtra `startDates` vencidas) |
| GET | `/admin/all` | Admin | Lista todos con fechas completas |
| POST | `/` | Admin | Crear curso |
| PUT | `/:id` | Admin | Editar curso |
| DELETE | `/:id` | Admin | Eliminar curso |

### Users — `/api/users`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/` | Admin | Lista todos los usuarios |
| PUT | `/:id/access` | Admin | Reemplaza `enrolledCourses` |
| PUT | `/:id/certify` | Admin | Toggle de `courseId` en `completedCourses` |
| DELETE | `/:id` | Admin | Eliminar usuario |

### Articles — `/api/articles`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/` | Público | Lista artículos con `published: true` |
| GET | `/all` | Admin | Lista todos los artículos |
| POST | `/` | Admin | Crear artículo |
| PUT | `/:id` | Admin | Editar artículo |
| DELETE | `/:id` | Admin | Eliminar artículo |

### Upload — `/api/upload`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| POST | `/:courseId` | Admin | Subir archivo a un curso (multipart/form-data, campo `file`) |

### Files — `/api/files`

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/:courseId` | JWT + acceso | Lista archivos del curso |
| GET | `/download/:fileId` | JWT + acceso | Descargar archivo |
| DELETE | `/:fileId` | Admin | Eliminar archivo |

---

## Autenticación y autorización

- **`protect`**: verifica el header `Authorization: Bearer <token>` y adjunta `req.user`
- **`adminOnly`**: verifica `req.user.isAdmin === true`, retorna 403 si no

### Lógica de acceso al contenido

```
enrolledCourses contiene courseId  →  puede ver el iframe
completedCourses contiene courseId →  pantalla de "curso certificado" (iframe bloqueado)
```

El endpoint `/api/files` devuelve 403 si el estudiante está en `completedCourses`.

---

## Notas de despliegue (Render)

- `app.set('trust proxy', 1)` habilitado — necesario para que `express-rate-limit` funcione detrás del proxy de Render
- CORS restringido a `FRONTEND_URL` + `localhost:5173` + `localhost:4173`
- La carpeta `uploads/` debe persistir entre deploys (en el plan gratuito de Render se borra al redesplegar — considerar migrar a S3 o Cloudinary a futuro)
- La instancia se duerme tras inactividad en el plan gratuito

---

## Crear el usuario administrador

Antes del primer uso, correr el script de seed con las variables de entorno cargadas:

```bash
node scripts/crear-admin.js
```

Esto crea el usuario admin en la base de datos. La contraseña inicial debe cambiarse desde el panel o mediante el flujo de recuperación de contraseña.
