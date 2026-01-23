# Configuración de Variables de Entorno

Este proyecto utiliza variables de entorno para gestionar configuraciones sensibles y específicas del entorno.

## 📋 Configuración Inicial

### 1. Crear archivo `.env`

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

### 2. Completar las variables

Abre el archivo `.env` y completa todas las variables necesarias según tu entorno.

## 🔐 Variables Requeridas

### Base de Datos (MongoDB)

```env
MONGODB_URI=mongodb://localhost:27017/fesc-proyectos
```

- **Local**: `mongodb://localhost:27017/fesc-proyectos`
- **Atlas/Remoto**: `mongodb+srv://usuario:password@cluster.mongodb.net/fesc-proyectos`

### Autenticación (JWT)

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

**⚠️ IMPORTANTE**: 
- En producción, genera una clave segura con: `openssl rand -base64 32`
- Nunca uses la clave por defecto en producción
- `JWT_EXPIRE` puede ser: `1h`, `7d`, `30m`, etc.

### Servidor

```env
PORT=4321
NODE_ENV=development
```

- `PORT`: Puerto donde correrá el servidor
- `NODE_ENV`: `development`, `production`, o `test`

### CORS

```env
CORS_ORIGIN=http://localhost:4321
```

- En producción, cambiar por el dominio real: `https://tu-dominio.com`

### Email (SMTP) - Opcional

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-contraseña-de-aplicacion
SMTP_FROM=tu-email@gmail.com
APP_URL=http://localhost:4321
```

#### Configuración para Gmail

1. Activa la **verificación en 2 pasos** en tu cuenta de Google
2. Crea una **Contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - O: https://support.google.com/accounts/answer/185833
   - Genera una contraseña específica para esta aplicación
3. Usa esa contraseña en `SMTP_PASSWORD` (no tu contraseña normal)

#### Otros proveedores SMTP

- **Outlook**: `smtp-mail.outlook.com`, puerto `587`
- **SendGrid**: `smtp.sendgrid.net`, puerto `587`
- **Mailgun**: `smtp.mailgun.org`, puerto `587`

## 🚀 Uso en Diferentes Entornos

### Desarrollo Local

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fesc-proyectos
PORT=4321
CORS_ORIGIN=http://localhost:4321
```

### Producción

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/fesc-proyectos
PORT=4321
CORS_ORIGIN=https://tu-dominio.com
JWT_SECRET=clave-super-segura-generada-con-openssl
APP_URL=https://tu-dominio.com
```

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **NUNCA** subas el archivo `.env` al repositorio
2. El archivo `.env` está en `.gitignore` por seguridad
3. Usa diferentes valores para desarrollo y producción
4. Genera claves seguras para producción
5. Rota las contraseñas periódicamente

### ❌ Qué NO hacer

- ❌ No hardcodees valores sensibles en el código
- ❌ No compartas el archivo `.env` públicamente
- ❌ No uses la misma configuración en desarrollo y producción
- ❌ No uses contraseñas débiles o predecibles

## 📝 Verificación

Para verificar que las variables están cargadas correctamente:

1. Inicia el servidor: `npm run dev`
2. Revisa los logs de la consola
3. Si hay errores de configuración, verifica que todas las variables estén definidas

## 🆘 Solución de Problemas

### Error: "Configuración SMTP no encontrada"

- Verifica que `SMTP_USER` y `SMTP_PASSWORD` estén configurados
- Si no necesitas emails, puedes dejar estos campos vacíos (el sistema funcionará sin emails)

### Error: "MongoDB no conectado"

- Verifica que `MONGODB_URI` sea correcta
- Asegúrate de que MongoDB esté corriendo (si es local)
- Verifica las credenciales (si es remoto)

### Error: "JWT_SECRET no configurado"

- Asegúrate de tener `JWT_SECRET` configurado
- En producción, usa una clave segura generada con `openssl rand -base64 32`

## 📚 Referencias

- [Documentación de Astro - Variables de Entorno](https://docs.astro.build/en/guides/environment-variables/)
- [MongoDB Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
