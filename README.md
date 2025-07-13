# ExpensePilot (Proyecto de Firebase Studio)

Este es un proyecto de Next.js creado en Firebase Studio para gestionar gastos personales.

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm o yarn

## Cómo Empezar

1.  **Clonar el repositorio (si aplica):**
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-directorio>
    ```

2.  **Instalar dependencias:**
    Abre una terminal en la raíz del proyecto y ejecuta:
    ```bash
    npm install
    ```
    o si usas yarn:
    ```bash
    yarn install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo llamado `.env.local` en la raíz del proyecto y añade las claves de API necesarias si vas a usar los flujos de Genkit. Si no, puedes dejarlo vacío por ahora.
    ```
    GOOGLE_API_KEY=TU_API_KEY_DE_GOOGLE_AI
    ```

4.  **Ejecutar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```

5.  **Abrir la aplicación:**
    Abre tu navegador y visita [http://localhost:9002](http://localhost:9002) (o el puerto que se indique en tu terminal).

## Scripts Disponibles

- `npm run dev`: Inicia la aplicación en modo de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run start`: Inicia un servidor de producción.
- `npm run lint`: Ejecuta el linter de código.
