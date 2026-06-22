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
exports.CourseDocument = void 0;
const typeorm_1 = require("typeorm");
/**
 * Documentos asociados a cursos
 * Casos prácticos, contratos, políticas, procedimientos legales
 * que el alumno verá durante la simulación
 */
let CourseDocument = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('course_documents')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _document_name_decorators;
    let _document_name_initializers = [];
    let _document_name_extraInitializers = [];
    let _document_type_decorators;
    let _document_type_initializers = [];
    let _document_type_extraInitializers = [];
    let _document_content_decorators;
    let _document_content_initializers = [];
    let _document_content_extraInitializers = [];
    let _file_url_decorators;
    let _file_url_initializers = [];
    let _file_url_extraInitializers = [];
    let _uploaded_by_decorators;
    let _uploaded_by_initializers = [];
    let _uploaded_by_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    var CourseDocument = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.document_name = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _document_name_initializers, void 0));
            this.document_type = (__runInitializers(this, _document_name_extraInitializers), __runInitializers(this, _document_type_initializers, void 0));
            this.document_content = (__runInitializers(this, _document_type_extraInitializers), __runInitializers(this, _document_content_initializers, void 0));
            this.file_url = (__runInitializers(this, _document_content_extraInitializers), __runInitializers(this, _file_url_initializers, void 0));
            this.uploaded_by = (__runInitializers(this, _file_url_extraInitializers), __runInitializers(this, _uploaded_by_initializers, void 0));
            this.created_at = (__runInitializers(this, _uploaded_by_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            __runInitializers(this, _created_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "CourseDocument");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _document_name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 200 })];
        _document_type_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['case', 'contract', 'policy', 'legal', 'procedure', 'other'],
                default: 'other'
            })];
        _document_content_decorators = [(0, typeorm_1.Column)({ type: 'longtext', nullable: true })];
        _file_url_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true })];
        _uploaded_by_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _document_name_decorators, { kind: "field", name: "document_name", static: false, private: false, access: { has: obj => "document_name" in obj, get: obj => obj.document_name, set: (obj, value) => { obj.document_name = value; } }, metadata: _metadata }, _document_name_initializers, _document_name_extraInitializers);
        __esDecorate(null, null, _document_type_decorators, { kind: "field", name: "document_type", static: false, private: false, access: { has: obj => "document_type" in obj, get: obj => obj.document_type, set: (obj, value) => { obj.document_type = value; } }, metadata: _metadata }, _document_type_initializers, _document_type_extraInitializers);
        __esDecorate(null, null, _document_content_decorators, { kind: "field", name: "document_content", static: false, private: false, access: { has: obj => "document_content" in obj, get: obj => obj.document_content, set: (obj, value) => { obj.document_content = value; } }, metadata: _metadata }, _document_content_initializers, _document_content_extraInitializers);
        __esDecorate(null, null, _file_url_decorators, { kind: "field", name: "file_url", static: false, private: false, access: { has: obj => "file_url" in obj, get: obj => obj.file_url, set: (obj, value) => { obj.file_url = value; } }, metadata: _metadata }, _file_url_initializers, _file_url_extraInitializers);
        __esDecorate(null, null, _uploaded_by_decorators, { kind: "field", name: "uploaded_by", static: false, private: false, access: { has: obj => "uploaded_by" in obj, get: obj => obj.uploaded_by, set: (obj, value) => { obj.uploaded_by = value; } }, metadata: _metadata }, _uploaded_by_initializers, _uploaded_by_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CourseDocument = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CourseDocument = _classThis;
})();
exports.CourseDocument = CourseDocument;
