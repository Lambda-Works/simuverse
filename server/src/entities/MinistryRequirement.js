"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinistryRequirement = void 0;
const typeorm_1 = require("typeorm");
const Course_1 = require("./Course");
const User_1 = require("./User");
const KPI_1 = require("./KPI");
/**
 * Requisitos ministeriales (archivos con KPIs y criterios de evaluación)
 * Se suben archivos DOCX, PDF, XLS, PNG con criterios del ministerio
 * El sistema extrae automáticamente los KPIs y genera tareas
 */
let MinistryRequirement = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('ministry_requirements'), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['status']), (0, typeorm_1.Index)(['created_at'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _uploaded_by_id_decorators;
    let _uploaded_by_id_initializers = [];
    let _uploaded_by_id_extraInitializers = [];
    let _file_name_decorators;
    let _file_name_initializers = [];
    let _file_name_extraInitializers = [];
    let _file_type_decorators;
    let _file_type_initializers = [];
    let _file_type_extraInitializers = [];
    let _file_size_bytes_decorators;
    let _file_size_bytes_initializers = [];
    let _file_size_bytes_extraInitializers = [];
    let _file_path_decorators;
    let _file_path_initializers = [];
    let _file_path_extraInitializers = [];
    let _raw_text_decorators;
    let _raw_text_initializers = [];
    let _raw_text_extraInitializers = [];
    let _extracted_content_decorators;
    let _extracted_content_initializers = [];
    let _extracted_content_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _processing_notes_decorators;
    let _processing_notes_initializers = [];
    let _processing_notes_extraInitializers = [];
    let _kpis_generated_decorators;
    let _kpis_generated_initializers = [];
    let _kpis_generated_extraInitializers = [];
    let _tasks_generated_decorators;
    let _tasks_generated_initializers = [];
    let _tasks_generated_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _activated_at_decorators;
    let _activated_at_initializers = [];
    let _activated_at_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _uploaded_by_decorators;
    let _uploaded_by_initializers = [];
    let _uploaded_by_extraInitializers = [];
    let _kpis_decorators;
    let _kpis_initializers = [];
    let _kpis_extraInitializers = [];
    var MinistryRequirement = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.uploaded_by_id = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _uploaded_by_id_initializers, void 0));
            // Información del archivo
            this.file_name = (__runInitializers(this, _uploaded_by_id_extraInitializers), __runInitializers(this, _file_name_initializers, void 0));
            this.file_type = (__runInitializers(this, _file_name_extraInitializers), __runInitializers(this, _file_type_initializers, void 0));
            this.file_size_bytes = (__runInitializers(this, _file_type_extraInitializers), __runInitializers(this, _file_size_bytes_initializers, void 0));
            this.file_path = (__runInitializers(this, _file_size_bytes_extraInitializers), __runInitializers(this, _file_path_initializers, void 0)); // Ruta en servidor
            // Contenido extraído
            this.raw_text = (__runInitializers(this, _file_path_extraInitializers), __runInitializers(this, _raw_text_initializers, void 0)); // Texto extraído del archivo
            this.extracted_content = (__runInitializers(this, _raw_text_extraInitializers), __runInitializers(this, _extracted_content_initializers, void 0));
            // Estado del procesamiento
            this.status = (__runInitializers(this, _extracted_content_extraInitializers), __runInitializers(this, _status_initializers, void 0)); // uploaded -> processing -> extracted -> active
            this.processing_notes = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _processing_notes_initializers, void 0)); // Notas si ocurrió error al procesar
            // Metadata
            this.kpis_generated = (__runInitializers(this, _processing_notes_extraInitializers), __runInitializers(this, _kpis_generated_initializers, void 0)); // Cantidad de KPIs extraídos
            this.tasks_generated = (__runInitializers(this, _kpis_generated_extraInitializers), __runInitializers(this, _tasks_generated_initializers, void 0)); // Cantidad de tareas creadas
            this.is_active = (__runInitializers(this, _tasks_generated_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.created_at = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            this.activated_at = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _activated_at_initializers, void 0)); // Cuándo se activó
            // Relations
            this.course = (__runInitializers(this, _activated_at_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.uploaded_by = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _uploaded_by_initializers, void 0));
            this.kpis = (__runInitializers(this, _uploaded_by_extraInitializers), __runInitializers(this, _kpis_initializers, void 0));
            __runInitializers(this, _kpis_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "MinistryRequirement");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _uploaded_by_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _file_name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _file_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 20 })];
        _file_size_bytes_decorators = [(0, typeorm_1.Column)({ type: 'bigint' })];
        _file_path_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _raw_text_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _extracted_content_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _status_decorators = [(0, typeorm_1.Column)({ type: 'varchar', default: 'uploaded' })];
        _processing_notes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _kpis_generated_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _tasks_generated_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _activated_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, course => course.ministry_requirements, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _uploaded_by_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, user => user.ministry_requirements_uploaded, { onDelete: 'SET NULL', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' })];
        _kpis_decorators = [(0, typeorm_1.OneToMany)(() => KPI_1.KPI, kpi => kpi.ministry_requirement)];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _uploaded_by_id_decorators, { kind: "field", name: "uploaded_by_id", static: false, private: false, access: { has: obj => "uploaded_by_id" in obj, get: obj => obj.uploaded_by_id, set: (obj, value) => { obj.uploaded_by_id = value; } }, metadata: _metadata }, _uploaded_by_id_initializers, _uploaded_by_id_extraInitializers);
        __esDecorate(null, null, _file_name_decorators, { kind: "field", name: "file_name", static: false, private: false, access: { has: obj => "file_name" in obj, get: obj => obj.file_name, set: (obj, value) => { obj.file_name = value; } }, metadata: _metadata }, _file_name_initializers, _file_name_extraInitializers);
        __esDecorate(null, null, _file_type_decorators, { kind: "field", name: "file_type", static: false, private: false, access: { has: obj => "file_type" in obj, get: obj => obj.file_type, set: (obj, value) => { obj.file_type = value; } }, metadata: _metadata }, _file_type_initializers, _file_type_extraInitializers);
        __esDecorate(null, null, _file_size_bytes_decorators, { kind: "field", name: "file_size_bytes", static: false, private: false, access: { has: obj => "file_size_bytes" in obj, get: obj => obj.file_size_bytes, set: (obj, value) => { obj.file_size_bytes = value; } }, metadata: _metadata }, _file_size_bytes_initializers, _file_size_bytes_extraInitializers);
        __esDecorate(null, null, _file_path_decorators, { kind: "field", name: "file_path", static: false, private: false, access: { has: obj => "file_path" in obj, get: obj => obj.file_path, set: (obj, value) => { obj.file_path = value; } }, metadata: _metadata }, _file_path_initializers, _file_path_extraInitializers);
        __esDecorate(null, null, _raw_text_decorators, { kind: "field", name: "raw_text", static: false, private: false, access: { has: obj => "raw_text" in obj, get: obj => obj.raw_text, set: (obj, value) => { obj.raw_text = value; } }, metadata: _metadata }, _raw_text_initializers, _raw_text_extraInitializers);
        __esDecorate(null, null, _extracted_content_decorators, { kind: "field", name: "extracted_content", static: false, private: false, access: { has: obj => "extracted_content" in obj, get: obj => obj.extracted_content, set: (obj, value) => { obj.extracted_content = value; } }, metadata: _metadata }, _extracted_content_initializers, _extracted_content_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _processing_notes_decorators, { kind: "field", name: "processing_notes", static: false, private: false, access: { has: obj => "processing_notes" in obj, get: obj => obj.processing_notes, set: (obj, value) => { obj.processing_notes = value; } }, metadata: _metadata }, _processing_notes_initializers, _processing_notes_extraInitializers);
        __esDecorate(null, null, _kpis_generated_decorators, { kind: "field", name: "kpis_generated", static: false, private: false, access: { has: obj => "kpis_generated" in obj, get: obj => obj.kpis_generated, set: (obj, value) => { obj.kpis_generated = value; } }, metadata: _metadata }, _kpis_generated_initializers, _kpis_generated_extraInitializers);
        __esDecorate(null, null, _tasks_generated_decorators, { kind: "field", name: "tasks_generated", static: false, private: false, access: { has: obj => "tasks_generated" in obj, get: obj => obj.tasks_generated, set: (obj, value) => { obj.tasks_generated = value; } }, metadata: _metadata }, _tasks_generated_initializers, _tasks_generated_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _activated_at_decorators, { kind: "field", name: "activated_at", static: false, private: false, access: { has: obj => "activated_at" in obj, get: obj => obj.activated_at, set: (obj, value) => { obj.activated_at = value; } }, metadata: _metadata }, _activated_at_initializers, _activated_at_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _uploaded_by_decorators, { kind: "field", name: "uploaded_by", static: false, private: false, access: { has: obj => "uploaded_by" in obj, get: obj => obj.uploaded_by, set: (obj, value) => { obj.uploaded_by = value; } }, metadata: _metadata }, _uploaded_by_initializers, _uploaded_by_extraInitializers);
        __esDecorate(null, null, _kpis_decorators, { kind: "field", name: "kpis", static: false, private: false, access: { has: obj => "kpis" in obj, get: obj => obj.kpis, set: (obj, value) => { obj.kpis = value; } }, metadata: _metadata }, _kpis_initializers, _kpis_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MinistryRequirement = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MinistryRequirement = _classThis;
})();
exports.MinistryRequirement = MinistryRequirement;
