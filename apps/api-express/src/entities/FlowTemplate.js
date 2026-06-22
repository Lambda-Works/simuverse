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
exports.FlowTemplate = void 0;
const typeorm_1 = require("typeorm");
/**
 * Plantillas de flujo de cursos (FlowTemplates)
 * Almacena la configuración completa de un escenario: inbox, herramientas,
 * crisis events, criterios de evaluación, persona IA, etc.
 */
let FlowTemplate = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('flow_templates'), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['family']), (0, typeorm_1.Index)(['is_active'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _course_code_decorators;
    let _course_code_initializers = [];
    let _course_code_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _family_decorators;
    let _family_initializers = [];
    let _family_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _version_decorators;
    let _version_initializers = [];
    let _version_extraInitializers = [];
    let _template_data_decorators;
    let _template_data_initializers = [];
    let _template_data_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _created_by_decorators;
    let _created_by_initializers = [];
    let _created_by_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    var FlowTemplate = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.course_code = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _course_code_initializers, void 0));
            this.title = (__runInitializers(this, _course_code_extraInitializers), __runInitializers(this, _title_initializers, void 0));
            this.family = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _family_initializers, void 0));
            this.description = (__runInitializers(this, _family_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.version = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _version_initializers, void 0));
            this.template_data = (__runInitializers(this, _version_extraInitializers), __runInitializers(this, _template_data_initializers, void 0)); // JSON serializado del FlowTemplate completo
            this.is_active = (__runInitializers(this, _template_data_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.created_by = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _created_by_initializers, void 0));
            this.created_at = (__runInitializers(this, _created_by_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            __runInitializers(this, _updated_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "FlowTemplate");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 100 })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _course_code_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50 })];
        _title_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _family_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50, default: 'administracion' })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _version_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 20, default: '1.0' })];
        _template_data_decorators = [(0, typeorm_1.Column)({ type: 'longtext' })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _created_by_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _course_code_decorators, { kind: "field", name: "course_code", static: false, private: false, access: { has: obj => "course_code" in obj, get: obj => obj.course_code, set: (obj, value) => { obj.course_code = value; } }, metadata: _metadata }, _course_code_initializers, _course_code_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _family_decorators, { kind: "field", name: "family", static: false, private: false, access: { has: obj => "family" in obj, get: obj => obj.family, set: (obj, value) => { obj.family = value; } }, metadata: _metadata }, _family_initializers, _family_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _version_decorators, { kind: "field", name: "version", static: false, private: false, access: { has: obj => "version" in obj, get: obj => obj.version, set: (obj, value) => { obj.version = value; } }, metadata: _metadata }, _version_initializers, _version_extraInitializers);
        __esDecorate(null, null, _template_data_decorators, { kind: "field", name: "template_data", static: false, private: false, access: { has: obj => "template_data" in obj, get: obj => obj.template_data, set: (obj, value) => { obj.template_data = value; } }, metadata: _metadata }, _template_data_initializers, _template_data_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _created_by_decorators, { kind: "field", name: "created_by", static: false, private: false, access: { has: obj => "created_by" in obj, get: obj => obj.created_by, set: (obj, value) => { obj.created_by = value; } }, metadata: _metadata }, _created_by_initializers, _created_by_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FlowTemplate = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FlowTemplate = _classThis;
})();
exports.FlowTemplate = FlowTemplate;
