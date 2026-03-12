import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCourseConfigColumns1705424000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Agregar columnas faltantes a course_config
        const table = await queryRunner.getTable("course_config");
        
        if (!table) {
            throw new Error("Table 'course_config' not found");
        }

        // Agregar cada columna si no existe
        if (!table.findColumnByName("active_modules")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "active_modules",
                    type: "json",
                    isNullable: true,
                    default: null,
                    comment: "Módulos activos en el curso"
                })
            );
        }

        if (!table.findColumnByName("ui_config")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "ui_config",
                    type: "json",
                    isNullable: true,
                    default: null,
                    comment: "Configuración de UI"
                })
            );
        }

        if (!table.findColumnByName("ia_config")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "ia_config",
                    type: "json",
                    isNullable: true,
                    default: null,
                    comment: "Configuración de IA"
                })
            );
        }

        if (!table.findColumnByName("family_type")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "family_type",
                    type: "varchar",
                    length: "50",
                    isNullable: true,
                    default: null,
                    comment: "Tipo de familia profesional"
                })
            );
        }

        if (!table.findColumnByName("calculator_config")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "calculator_config",
                    type: "json",
                    isNullable: true,
                    default: null,
                    comment: "Configuración de calculadora"
                })
            );
        }

        if (!table.findColumnByName("inbox_config")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "inbox_config",
                    type: "json",
                    isNullable: true,
                    default: null,
                    comment: "Configuración de bandeja de entrada"
                })
            );
        }

        if (!table.findColumnByName("validation_rules")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "validation_rules",
                    type: "json",
                    isNullable: true,
                    default: null,
                    comment: "Reglas de validación"
                })
            );
        }

        if (!table.findColumnByName("prompt_generated_by")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "prompt_generated_by",
                    type: "varchar",
                    length: "36",
                    isNullable: true,
                    default: null,
                    comment: "Usuario que generó el prompt"
                })
            );
        }

        if (!table.findColumnByName("prompt_generated_at")) {
            await queryRunner.addColumn(
                "course_config",
                new TableColumn({
                    name: "prompt_generated_at",
                    type: "timestamp",
                    isNullable: true,
                    default: null,
                    comment: "Cuándo se generó el prompt"
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("course_config");
        
        if (!table) return;

        // Remover las columnas agregadas
        const columnsToRemove = [
            "active_modules",
            "ui_config",
            "ia_config",
            "family_type",
            "calculator_config",
            "inbox_config",
            "validation_rules",
            "prompt_generated_by",
            "prompt_generated_at"
        ];

        for (const columnName of columnsToRemove) {
            if (table.findColumnByName(columnName)) {
                await queryRunner.dropColumn("course_config", columnName);
            }
        }
    }
}
