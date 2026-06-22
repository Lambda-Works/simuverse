-- Migration: Aumentar tamaño de file_url en tech_sheets
-- Fecha: 11 de Marzo 2026
-- Razón: Error "Data too long for column 'file_url'" cuando se cargan PDFs como base64

USE simuverse;

-- Cambiar file_url de VARCHAR(500) a TEXT para permitir contenido base64 largo
ALTER TABLE tech_sheets 
MODIFY COLUMN file_url TEXT DEFAULT NULL;

-- Verificar el cambio
DESCRIBE tech_sheets;
