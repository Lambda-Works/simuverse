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
exports.FileUpload = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Course_1 = require("./Course");
const MinistryRequirement_1 = require("./MinistryRequirement");
/**
 * Registro de archivos subidos al sistema
 * Rastrea nombre, tamaño, tipo, quién subió, cuándo, dónde se guarda
 */
let FileUpload = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('file_uploads'), (0, typeorm_1.Index)(['uploaded_by_id']), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['ministry_requirement_id']), (0, typeorm_1.Index)(['created_at'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _uploaded_by_id_decorators;
    let _uploaded_by_id_initializers = [];
    let _uploaded_by_id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _ministry_requirement_id_decorators;
    let _ministry_requirement_id_initializers = [];
    let _ministry_requirement_id_extraInitializers = [];
    let _file_name_decorators;
    let _file_name_initializers = [];
    let _file_name_extraInitializers = [];
    let _file_type_decorators;
    let _file_type_initializers = [];
    let _file_type_extraInitializers = [];
    let _upload_type_decorators;
    let _upload_type_initializers = [];
    let _upload_type_extraInitializers = [];
    let _file_size_bytes_decorators;
    let _file_size_bytes_initializers = [];
    let _file_size_bytes_extraInitializers = [];
    let _file_path_decorators;
    let _file_path_initializers = [];
    let _file_path_extraInitializers = [];
    let _file_hash_decorators;
    let _file_hash_initializers = [];
    let _file_hash_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _uploaded_by_decorators;
    let _uploaded_by_initializers = [];
    let _uploaded_by_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _ministry_requirement_decorators;
    let _ministry_requirement_initializers = [];
    let _ministry_requirement_extraInitializers = [];
    var FileUpload = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.uploaded_by_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _uploaded_by_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _uploaded_by_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.ministry_requirement_id = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _ministry_requirement_id_initializers, void 0));
            // Información del archivo
            this.file_name = (__runInitializers(this, _ministry_requirement_id_extraInitializers), __runInitializers(this, _file_name_initializers, void 0));
            this.file_type = (__runInitializers(this, _file_name_extraInitializers), __runInitializers(this, _file_type_initializers, void 0)); // pdf, docx, xlsx, png, jpg, txt
            this.upload_type = (__runInitializers(this, _file_type_extraInitializers), __runInitializers(this, _upload_type_initializers, void 0));
            this.file_size_bytes = (__runInitializers(this, _upload_type_extraInitializers), __runInitializers(this, _file_size_bytes_initializers, void 0));
            this.file_path = (__runInitializers(this, _file_size_bytes_extraInitializers), __runInitializers(this, _file_path_initializers, void 0)); // Ruta relativa al servidor (ej: /uploads/course_id/filename.pdf)
            this.file_hash = (__runInitializers(this, _file_path_extraInitializers), __runInitializers(this, _file_hash_initializers, void 0)); // SHA256 del archivo para detectar duplicados
            this.description = (__runInitializers(this, _file_hash_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.is_active = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.created_at = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            // Relations
            this.uploaded_by = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _uploaded_by_initializers, void 0));
            this.course = (__runInitializers(this, _uploaded_by_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.ministry_requirement = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _ministry_requirement_initializers, void 0));
            __runInitializers(this, _ministry_requirement_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "FileUpload");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _uploaded_by_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _ministry_requirement_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _file_name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _file_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50 })];
        _upload_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 20 })];
        _file_size_bytes_decorators = [(0, typeorm_1.Column)({ type: 'bigint' })];
        _file_path_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _file_hash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _uploaded_by_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, user => user.file_uploads, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'uploaded_by_id' })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, { onDelete: 'SET NULL', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _ministry_requirement_decorators = [(0, typeorm_1.ManyToOne)(() => MinistryRequirement_1.MinistryRequirement, { onDelete: 'CASCADE', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'ministry_requirement_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _uploaded_by_id_decorators, { kind: "field", name: "uploaded_by_id", static: false, private: false, access: { has: obj => "uploaded_by_id" in obj, get: obj => obj.uploaded_by_id, set: (obj, value) => { obj.uploaded_by_id = value; } }, metadata: _metadata }, _uploaded_by_id_initializers, _uploaded_by_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _ministry_requirement_id_decorators, { kind: "field", name: "ministry_requirement_id", static: false, private: false, access: { has: obj => "ministry_requirement_id" in obj, get: obj => obj.ministry_requirement_id, set: (obj, value) => { obj.ministry_requirement_id = value; } }, metadata: _metadata }, _ministry_requirement_id_initializers, _ministry_requirement_id_extraInitializers);
        __esDecorate(null, null, _file_name_decorators, { kind: "field", name: "file_name", static: false, private: false, access: { has: obj => "file_name" in obj, get: obj => obj.file_name, set: (obj, value) => { obj.file_name = value; } }, metadata: _metadata }, _file_name_initializers, _file_name_extraInitializers);
        __esDecorate(null, null, _file_type_decorators, { kind: "field", name: "file_type", static: false, private: false, access: { has: obj => "file_type" in obj, get: obj => obj.file_type, set: (obj, value) => { obj.file_type = value; } }, metadata: _metadata }, _file_type_initializers, _file_type_extraInitializers);
        __esDecorate(null, null, _upload_type_decorators, { kind: "field", name: "upload_type", static: false, private: false, access: { has: obj => "upload_type" in obj, get: obj => obj.upload_type, set: (obj, value) => { obj.upload_type = value; } }, metadata: _metadata }, _upload_type_initializers, _upload_type_extraInitializers);
        __esDecorate(null, null, _file_size_bytes_decorators, { kind: "field", name: "file_size_bytes", static: false, private: false, access: { has: obj => "file_size_bytes" in obj, get: obj => obj.file_size_bytes, set: (obj, value) => { obj.file_size_bytes = value; } }, metadata: _metadata }, _file_size_bytes_initializers, _file_size_bytes_extraInitializers);
        __esDecorate(null, null, _file_path_decorators, { kind: "field", name: "file_path", static: false, private: false, access: { has: obj => "file_path" in obj, get: obj => obj.file_path, set: (obj, value) => { obj.file_path = value; } }, metadata: _metadata }, _file_path_initializers, _file_path_extraInitializers);
        __esDecorate(null, null, _file_hash_decorators, { kind: "field", name: "file_hash", static: false, private: false, access: { has: obj => "file_hash" in obj, get: obj => obj.file_hash, set: (obj, value) => { obj.file_hash = value; } }, metadata: _metadata }, _file_hash_initializers, _file_hash_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _uploaded_by_decorators, { kind: "field", name: "uploaded_by", static: false, private: false, access: { has: obj => "uploaded_by" in obj, get: obj => obj.uploaded_by, set: (obj, value) => { obj.uploaded_by = value; } }, metadata: _metadata }, _uploaded_by_initializers, _uploaded_by_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _ministry_requirement_decorators, { kind: "field", name: "ministry_requirement", static: false, private: false, access: { has: obj => "ministry_requirement" in obj, get: obj => obj.ministry_requirement, set: (obj, value) => { obj.ministry_requirement = value; } }, metadata: _metadata }, _ministry_requirement_initializers, _ministry_requirement_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FileUpload = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FileUpload = _classThis;
})();
exports.FileUpload = FileUpload;
