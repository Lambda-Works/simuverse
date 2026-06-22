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
exports.CourseConfig = void 0;
const typeorm_1 = require("typeorm");
const Course_1 = require("./Course");
const TechSheet_1 = require("./TechSheet");
const PromptTemplate_1 = require("./PromptTemplate");
let CourseConfig = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('course_config')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _config_data_decorators;
    let _config_data_initializers = [];
    let _config_data_extraInitializers = [];
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
    let _active_modules_decorators;
    let _active_modules_initializers = [];
    let _active_modules_extraInitializers = [];
    let _ui_config_decorators;
    let _ui_config_initializers = [];
    let _ui_config_extraInitializers = [];
    let _ia_config_decorators;
    let _ia_config_initializers = [];
    let _ia_config_extraInitializers = [];
    let _family_type_decorators;
    let _family_type_initializers = [];
    let _family_type_extraInitializers = [];
    let _calculator_config_decorators;
    let _calculator_config_initializers = [];
    let _calculator_config_extraInitializers = [];
    let _inbox_config_decorators;
    let _inbox_config_initializers = [];
    let _inbox_config_extraInitializers = [];
    let _validation_rules_decorators;
    let _validation_rules_initializers = [];
    let _validation_rules_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _tech_sheet_id_decorators;
    let _tech_sheet_id_initializers = [];
    let _tech_sheet_id_extraInitializers = [];
    let _tech_sheet_decorators;
    let _tech_sheet_initializers = [];
    let _tech_sheet_extraInitializers = [];
    let _prompt_template_id_decorators;
    let _prompt_template_id_initializers = [];
    let _prompt_template_id_extraInitializers = [];
    let _prompt_template_decorators;
    let _prompt_template_initializers = [];
    let _prompt_template_extraInitializers = [];
    let _prompt_generation_mode_decorators;
    let _prompt_generation_mode_initializers = [];
    let _prompt_generation_mode_extraInitializers = [];
    let _prompt_generated_by_decorators;
    let _prompt_generated_by_initializers = [];
    let _prompt_generated_by_extraInitializers = [];
    let _prompt_generated_at_decorators;
    let _prompt_generated_at_initializers = [];
    let _prompt_generated_at_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    var CourseConfig = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.config_data = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _config_data_initializers, void 0));
            this.base_role = (__runInitializers(this, _config_data_extraInitializers), __runInitializers(this, _base_role_initializers, void 0));
            this.course_context = (__runInitializers(this, _base_role_extraInitializers), __runInitializers(this, _course_context_initializers, void 0));
            this.personality_traits = (__runInitializers(this, _course_context_extraInitializers), __runInitializers(this, _personality_traits_initializers, void 0));
            this.knowledge_base_prompt = (__runInitializers(this, _personality_traits_extraInitializers), __runInitializers(this, _knowledge_base_prompt_initializers, void 0));
            this.active_modules = (__runInitializers(this, _knowledge_base_prompt_extraInitializers), __runInitializers(this, _active_modules_initializers, void 0));
            this.ui_config = (__runInitializers(this, _active_modules_extraInitializers), __runInitializers(this, _ui_config_initializers, void 0));
            this.ia_config = (__runInitializers(this, _ui_config_extraInitializers), __runInitializers(this, _ia_config_initializers, void 0));
            this.family_type = (__runInitializers(this, _ia_config_extraInitializers), __runInitializers(this, _family_type_initializers, void 0));
            this.calculator_config = (__runInitializers(this, _family_type_extraInitializers), __runInitializers(this, _calculator_config_initializers, void 0));
            this.inbox_config = (__runInitializers(this, _calculator_config_extraInitializers), __runInitializers(this, _inbox_config_initializers, void 0));
            this.validation_rules = (__runInitializers(this, _inbox_config_extraInitializers), __runInitializers(this, _validation_rules_initializers, void 0));
            this.metadata = (__runInitializers(this, _validation_rules_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.created_at = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            // NUEVO: Relaciones para Ficha Técnica y Prompts
            this.tech_sheet_id = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _tech_sheet_id_initializers, void 0));
            this.tech_sheet = (__runInitializers(this, _tech_sheet_id_extraInitializers), __runInitializers(this, _tech_sheet_initializers, void 0));
            this.prompt_template_id = (__runInitializers(this, _tech_sheet_extraInitializers), __runInitializers(this, _prompt_template_id_initializers, void 0));
            this.prompt_template = (__runInitializers(this, _prompt_template_id_extraInitializers), __runInitializers(this, _prompt_template_initializers, void 0));
            this.prompt_generation_mode = (__runInitializers(this, _prompt_template_extraInitializers), __runInitializers(this, _prompt_generation_mode_initializers, void 0));
            this.prompt_generated_by = (__runInitializers(this, _prompt_generation_mode_extraInitializers), __runInitializers(this, _prompt_generated_by_initializers, void 0));
            this.prompt_generated_at = (__runInitializers(this, _prompt_generated_by_extraInitializers), __runInitializers(this, _prompt_generated_at_initializers, void 0));
            this.course = (__runInitializers(this, _prompt_generated_at_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            __runInitializers(this, _course_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "CourseConfig");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _config_data_decorators = [(0, typeorm_1.Column)({ type: 'json' })];
        _base_role_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _course_context_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _personality_traits_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _knowledge_base_prompt_decorators = [(0, typeorm_1.Column)({ type: 'longtext', nullable: true })];
        _active_modules_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _ui_config_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _ia_config_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _family_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true })];
        _calculator_config_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _inbox_config_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _validation_rules_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _tech_sheet_id_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _tech_sheet_decorators = [(0, typeorm_1.ManyToOne)(() => TechSheet_1.TechSheet, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'tech_sheet_id' })];
        _prompt_template_id_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true })];
        _prompt_template_decorators = [(0, typeorm_1.ManyToOne)(() => PromptTemplate_1.PromptTemplate, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'prompt_template_id' })];
        _prompt_generation_mode_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['template', 'manual', 'guided'],
                default: 'template'
            })];
        _prompt_generated_by_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36, nullable: true })];
        _prompt_generated_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _course_decorators = [(0, typeorm_1.OneToOne)(() => Course_1.Course, (course) => course.config), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _config_data_decorators, { kind: "field", name: "config_data", static: false, private: false, access: { has: obj => "config_data" in obj, get: obj => obj.config_data, set: (obj, value) => { obj.config_data = value; } }, metadata: _metadata }, _config_data_initializers, _config_data_extraInitializers);
        __esDecorate(null, null, _base_role_decorators, { kind: "field", name: "base_role", static: false, private: false, access: { has: obj => "base_role" in obj, get: obj => obj.base_role, set: (obj, value) => { obj.base_role = value; } }, metadata: _metadata }, _base_role_initializers, _base_role_extraInitializers);
        __esDecorate(null, null, _course_context_decorators, { kind: "field", name: "course_context", static: false, private: false, access: { has: obj => "course_context" in obj, get: obj => obj.course_context, set: (obj, value) => { obj.course_context = value; } }, metadata: _metadata }, _course_context_initializers, _course_context_extraInitializers);
        __esDecorate(null, null, _personality_traits_decorators, { kind: "field", name: "personality_traits", static: false, private: false, access: { has: obj => "personality_traits" in obj, get: obj => obj.personality_traits, set: (obj, value) => { obj.personality_traits = value; } }, metadata: _metadata }, _personality_traits_initializers, _personality_traits_extraInitializers);
        __esDecorate(null, null, _knowledge_base_prompt_decorators, { kind: "field", name: "knowledge_base_prompt", static: false, private: false, access: { has: obj => "knowledge_base_prompt" in obj, get: obj => obj.knowledge_base_prompt, set: (obj, value) => { obj.knowledge_base_prompt = value; } }, metadata: _metadata }, _knowledge_base_prompt_initializers, _knowledge_base_prompt_extraInitializers);
        __esDecorate(null, null, _active_modules_decorators, { kind: "field", name: "active_modules", static: false, private: false, access: { has: obj => "active_modules" in obj, get: obj => obj.active_modules, set: (obj, value) => { obj.active_modules = value; } }, metadata: _metadata }, _active_modules_initializers, _active_modules_extraInitializers);
        __esDecorate(null, null, _ui_config_decorators, { kind: "field", name: "ui_config", static: false, private: false, access: { has: obj => "ui_config" in obj, get: obj => obj.ui_config, set: (obj, value) => { obj.ui_config = value; } }, metadata: _metadata }, _ui_config_initializers, _ui_config_extraInitializers);
        __esDecorate(null, null, _ia_config_decorators, { kind: "field", name: "ia_config", static: false, private: false, access: { has: obj => "ia_config" in obj, get: obj => obj.ia_config, set: (obj, value) => { obj.ia_config = value; } }, metadata: _metadata }, _ia_config_initializers, _ia_config_extraInitializers);
        __esDecorate(null, null, _family_type_decorators, { kind: "field", name: "family_type", static: false, private: false, access: { has: obj => "family_type" in obj, get: obj => obj.family_type, set: (obj, value) => { obj.family_type = value; } }, metadata: _metadata }, _family_type_initializers, _family_type_extraInitializers);
        __esDecorate(null, null, _calculator_config_decorators, { kind: "field", name: "calculator_config", static: false, private: false, access: { has: obj => "calculator_config" in obj, get: obj => obj.calculator_config, set: (obj, value) => { obj.calculator_config = value; } }, metadata: _metadata }, _calculator_config_initializers, _calculator_config_extraInitializers);
        __esDecorate(null, null, _inbox_config_decorators, { kind: "field", name: "inbox_config", static: false, private: false, access: { has: obj => "inbox_config" in obj, get: obj => obj.inbox_config, set: (obj, value) => { obj.inbox_config = value; } }, metadata: _metadata }, _inbox_config_initializers, _inbox_config_extraInitializers);
        __esDecorate(null, null, _validation_rules_decorators, { kind: "field", name: "validation_rules", static: false, private: false, access: { has: obj => "validation_rules" in obj, get: obj => obj.validation_rules, set: (obj, value) => { obj.validation_rules = value; } }, metadata: _metadata }, _validation_rules_initializers, _validation_rules_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _tech_sheet_id_decorators, { kind: "field", name: "tech_sheet_id", static: false, private: false, access: { has: obj => "tech_sheet_id" in obj, get: obj => obj.tech_sheet_id, set: (obj, value) => { obj.tech_sheet_id = value; } }, metadata: _metadata }, _tech_sheet_id_initializers, _tech_sheet_id_extraInitializers);
        __esDecorate(null, null, _tech_sheet_decorators, { kind: "field", name: "tech_sheet", static: false, private: false, access: { has: obj => "tech_sheet" in obj, get: obj => obj.tech_sheet, set: (obj, value) => { obj.tech_sheet = value; } }, metadata: _metadata }, _tech_sheet_initializers, _tech_sheet_extraInitializers);
        __esDecorate(null, null, _prompt_template_id_decorators, { kind: "field", name: "prompt_template_id", static: false, private: false, access: { has: obj => "prompt_template_id" in obj, get: obj => obj.prompt_template_id, set: (obj, value) => { obj.prompt_template_id = value; } }, metadata: _metadata }, _prompt_template_id_initializers, _prompt_template_id_extraInitializers);
        __esDecorate(null, null, _prompt_template_decorators, { kind: "field", name: "prompt_template", static: false, private: false, access: { has: obj => "prompt_template" in obj, get: obj => obj.prompt_template, set: (obj, value) => { obj.prompt_template = value; } }, metadata: _metadata }, _prompt_template_initializers, _prompt_template_extraInitializers);
        __esDecorate(null, null, _prompt_generation_mode_decorators, { kind: "field", name: "prompt_generation_mode", static: false, private: false, access: { has: obj => "prompt_generation_mode" in obj, get: obj => obj.prompt_generation_mode, set: (obj, value) => { obj.prompt_generation_mode = value; } }, metadata: _metadata }, _prompt_generation_mode_initializers, _prompt_generation_mode_extraInitializers);
        __esDecorate(null, null, _prompt_generated_by_decorators, { kind: "field", name: "prompt_generated_by", static: false, private: false, access: { has: obj => "prompt_generated_by" in obj, get: obj => obj.prompt_generated_by, set: (obj, value) => { obj.prompt_generated_by = value; } }, metadata: _metadata }, _prompt_generated_by_initializers, _prompt_generated_by_extraInitializers);
        __esDecorate(null, null, _prompt_generated_at_decorators, { kind: "field", name: "prompt_generated_at", static: false, private: false, access: { has: obj => "prompt_generated_at" in obj, get: obj => obj.prompt_generated_at, set: (obj, value) => { obj.prompt_generated_at = value; } }, metadata: _metadata }, _prompt_generated_at_initializers, _prompt_generated_at_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        CourseConfig = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return CourseConfig = _classThis;
})();
exports.CourseConfig = CourseConfig;
