# FESC - Sistema de Gestión de Proyectos (Astro)

Este proyecto ha sido migrado de Next.js a **Astro con React usando la arquitectura de islas**.

## 🚀 Arquitectura de Islas

Este proyecto utiliza la arquitectura de islas de Astro, donde:
- **Componentes estáticos** se renderizan como HTML en el servidor (componentes `.astro`)
- **Componentes interactivos** se convierten en "islas" de React (componentes en `src/islands/`)
- Solo se envía JavaScript para los componentes que realmente necesitan interactividad

## 📦 Instalación

```bash
npm install
```

## 🛠️ Desarrollo

```bash
npm run dev
```

El servidor se iniciará en `http://localhost:4321`

## 🏗️ Estructura del Proyecto

```
my-app/
├── src/
│   ├── components/          # Componentes Astro (estáticos)
│   ├── islands/             # Componentes React (interactivos)
│   ├── layouts/             # Layouts de Astro
│   ├── lib/                 # Utilidades y tipos
│   ├── pages/               # Páginas (routing automático)
│   └── styles/              # Estilos globales
├── public/                   # Archivos estáticos
├── astro.config.mjs         # Configuración de Astro
└── package.json
```

## 🎯 Características

- ✅ Arquitectura de islas para máximo rendimiento
- ✅ React solo donde se necesita interactividad
- ✅ Tailwind CSS para estilos
- ✅ TypeScript para type safety
- ✅ Componentes UI de Radix UI

## 📝 Notas de Migración

- Los componentes que necesitan estado o interactividad están en `src/islands/`
- Los componentes estáticos están en `src/components/`
- Las páginas usan `.astro` en lugar de `.tsx`
- Los componentes React se importan con `client:load` para hidratación
