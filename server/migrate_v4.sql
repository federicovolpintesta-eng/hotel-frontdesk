CREATE TABLE IF NOT EXISTS usuarios_area (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    area_asignada VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
