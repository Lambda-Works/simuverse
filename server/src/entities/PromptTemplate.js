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
exports.PromptTemplate = void 0;
const typeorm_1 = require("typeorm");
/**
 * Plantillas de prompts reutilizables
 * Admin puede crear, editar, duplicar y desactivar plantillas
 * Luego asignarlas a cursos en place of hardcoding
 */
let PromptTemplate = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('prompt_templates')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _base_role_decorators;
    let _base_role_initializers = [];
    let _base_role_extraInitializers = [];
    let _course_context_decorators;
    let _course_context_initializers = [];
    let _course_context_extraInitializers = [];
    let _personality_traits_decorators;
    let _personality_traits_initializers = [];
    let _personality_traits_extraInitializers = [];
    let _knowledge_base_prompt_decorators;
    let _knowledge_base_prompt_initializers = [];
    let _knowledge_base_prompt_extraInitializers = [];
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
    var PromptTemplate = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.name = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.category = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _category_initializers, void 0)); // "service", "audit", "sales", "management"
            this.base_role = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _base_role_initializers, void 0));
            this.course_context = (__runInitializers(this, _base_role_extraInitializers), __runInitializers(this, _course_context_initializers, void 0));
            this.personality_traits = (__runInitializers(this, _course_context_extraInitializers), __runInitializers(this, _personality_traits_initializers, void 0));
            this.knowledge_base_prompt = (__runInitializers(this, _personality_traits_extraInitializers), __runInitializers(this, _knowledge_base_prompt_initializers, void 0));
            this.is_active = (__runInitializers(this, _knowledge_base_prompt_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.created_by = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _created_by_initializers, void 0));
            this.created_at = (__runInitializers(this, _created_by_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            __runInitializers(this, _updated_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "PromptTemplate");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _category_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true })];
        _base_role_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _course_context_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _personality_traits_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _knowledge_base_prompt_decorators = [(0, typeorm_1.Column)({ type: 'longtext' })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _created_by_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _base_role_decorators, { kind: "field", name: "base_role", static: false, private: false, access: { has: obj => "base_role" in obj, get: obj => obj.base_role, set: (obj, value) => { obj.base_role = value; } }, metadata: _metadata }, _base_role_initializers, _base_role_extraInitializers);
        __esDecorate(null, null, _course_context_decorators, { kind: "field", name: "course_context", static: false, private: false, access: { has: obj => "course_context" in obj, get: obj => obj.course_context, set: (obj, value) => { obj.course_context = value; } }, metadata: _metadata }, _course_context_initializers, _course_context_extraInitializers);
        __esDecorate(null, null, _personality_traits_decorators, { kind: "field", name: "personality_traits", static: false, private: false, access: { has: obj => "personality_traits" in obj, get: obj => obj.personality_traits, set: (obj, value) => { obj.personality_traits = value; } }, metadata: _metadata }, _personality_traits_initializers, _personality_traits_extraInitializers);
        __esDecorate(null, null, _knowledge_base_prompt_decorators, { kind: "field", name: "knowledge_base_prompt", static: false, private: false, access: { has: obj => "knowledge_base_prompt" in obj, get: obj => obj.knowledge_base_prompt, set: (obj, value) => { obj.knowledge_base_prompt = value; } }, metadata: _metadata }, _knowledge_base_prompt_initializers, _knowledge_base_prompt_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _created_by_decorators, { kind: "field", name: "created_by", static: false, private: false, access: { has: obj => "created_by" in obj, get: obj => obj.created_by, set: (obj, value) => { obj.created_by = value; } }, metadata: _metadata }, _created_by_initializers, _created_by_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PromptTemplate = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PromptTemplate = _classThis;
})();
exports.PromptTemplate = PromptTemplate;
