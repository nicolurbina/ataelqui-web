# FEFO API - Backend Express.js

API REST para el Sistema de Gestión FEFO (First Expiry, First Out) - Ataelqui

## 🚀 Características

- ✅ API REST completa con Express.js
- ✅ Integración con Firebase Firestore
- ✅ Autenticación con Firebase Auth
- ✅ Gestión de Productos
- ✅ Control de Inventario
- ✅ Gestión de Devoluciones
- ✅ Gestión de Tareas
- ✅ Gestión de Usuarios
- ✅ CORS habilitado
- ✅ TypeScript para seguridad de tipos

## 📋 Requisitos Previos

- Node.js 16+
- npm o yarn
- Cuenta en Firebase

## 🔧 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd fefo-api-express
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

4. **Agregar credenciales de Firebase**
- Obtener credenciales de Firebase Console
- Completar las variables en `.env`:
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_PRIVATE_KEY`
  - `FIREBASE_CLIENT_EMAIL`

## 🏃 Ejecutar el Servidor

**Modo desarrollo:**
```bash
npm run dev
```

**Modo producción:**
```bash
npm run build
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## 📚 Endpoints de la API

### 🛍️ Productos (`/api/products`)
- `GET /api/products` - Obtener todos los productos
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear nuevo producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto

### 📦 Inventario (`/api/inventory`)
- `GET /api/inventory` - Obtener todos los items del inventario
- `GET /api/inventory/:id` - Obtener item por ID
- `POST /api/inventory` - Crear nuevo item
- `PUT /api/inventory/:id` - Actualizar item
- `DELETE /api/inventory/:id` - Eliminar item
- `GET /api/inventory/stats/fefo-alerts` - Obtener alertas FEFO

### 🔄 Devoluciones (`/api/returns`)
- `GET /api/returns` - Obtener todas las devoluciones
- `GET /api/returns/:id` - Obtener devolución por ID
- `POST /api/returns` - Crear nueva devolución
- `PUT /api/returns/:id` - Actualizar devolución
- `POST /api/returns/:id/approve` - Aprobar devolución
- `POST /api/returns/:id/reject` - Rechazar devolución

### ✅ Tareas (`/api/tasks`)
- `GET /api/tasks` - Obtener todas las tareas
- `GET /api/tasks/:id` - Obtener tarea por ID
- `POST /api/tasks` - Crear nueva tarea
- `PUT /api/tasks/:id` - Actualizar tarea
- `POST /api/tasks/:id/complete` - Completar tarea
- `DELETE /api/tasks/:id` - Eliminar tarea

### 👥 Usuarios (`/api/users`)
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

## 📝 Ejemplos de Uso

### Crear Producto
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Harina Selecta 1kg",
    "sku": "HAR-001",
    "category": "Harinas",
    "price": 2500,
    "cost": 1800,
    "description": "Harina de trigo selecta"
  }'
```

### Crear Item de Inventario
```bash
curl -X POST http://localhost:5000/api/inventory \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-id",
    "quantity": 100,
    "location": "A1",
    "expiryDate": "2025-06-01",
    "batchNumber": "BATCH-001",
    "status": "available"
  }'
```

### Crear Tarea
```bash
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Contar inventario",
    "description": "Realizar conteo físico",
    "type": "counting",
    "priority": "high",
    "assignedTo": "user-id",
    "dueDate": "2025-12-15",
    "createdBy": "manager-id"
  }'
```

## 🔐 Seguridad

- Variables sensibles en `.env` (nunca commitear)
- CORS configurado para dominio específico
- Validación de campos requeridos
- Manejo de errores con respuestas consistentes

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── firebase.ts          # Configuración de Firebase
├── routes/
│   ├── products.ts          # Rutas de productos
│   ├── inventory.ts         # Rutas de inventario
│   ├── returns.ts           # Rutas de devoluciones
│   ├── tasks.ts             # Rutas de tareas
│   └── users.ts             # Rutas de usuarios
├── types/
│   └── index.ts             # Tipos TypeScript
└── index.ts                 # Punto de entrada
```

## 🚀 Despliegue

### En Heroku
```bash
heroku create fefo-api
heroku config:set FIREBASE_PROJECT_ID=xxxxx
heroku config:set FIREBASE_PRIVATE_KEY=xxxxx
heroku config:set FIREBASE_CLIENT_EMAIL=xxxxx
git push heroku main
```

### En Firebase Cloud Functions
Usar `firebase-functions` para deploying sin servidor.

## 📞 Contacto

Para preguntas o soporte, contacta al equipo de desarrollo.

## 📄 Licencia

ISC
