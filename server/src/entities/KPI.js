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
exports.KPI = void 0;
const typeorm_1 = require("typeorm");
const Course_1 = require("./Course");
const MinistryRequirement_1 = require("./MinistryRequirement");
const Task_1 = require("./Task");
/**
 * KPI (Key Performance Indicator)
 * Extraídos de MinistryRequirement
 * Definen qué debe lograr el estudiante
 */
let KPI = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('kpis'), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['ministry_requirement_id']), (0, typeorm_1.Index)(['is_active'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _ministry_requirement_id_decorators;
    let _ministry_requirement_id_initializers = [];
    let _ministry_requirement_id_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _category_decorators;
    let _category_initializers = [];
    let _category_extraInitializers = [];
    let _weight_decorators;
    let _weight_initializers = [];
    let _weight_extraInitializers = [];
    let _target_value_decorators;
    let _target_value_initializers = [];
    let _target_value_extraInitializers = [];
    let _minimum_pass_value_decorators;
    let _minimum_pass_value_initializers = [];
    let _minimum_pass_value_extraInitializers = [];
    let _thresholds_decorators;
    let _thresholds_initializers = [];
    let _thresholds_extraInitializers = [];
    let _prompt_instruction_decorators;
    let _prompt_instruction_initializers = [];
    let _prompt_instruction_extraInitializers = [];
    let _trigger_event_decorators;
    let _trigger_event_initializers = [];
    let _trigger_event_extraInitializers = [];
    let _success_criteria_decorators;
    let _success_criteria_initializers = [];
    let _success_criteria_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _tasks_count_decorators;
    let _tasks_count_initializers = [];
    let _tasks_count_extraInitializers = [];
    let _students_achieved_decorators;
    let _students_achieved_initializers = [];
    let _students_achieved_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _ministry_requirement_decorators;
    let _ministry_requirement_initializers = [];
    let _ministry_requirement_extraInitializers = [];
    let _tasks_decorators;
    let _tasks_initializers = [];
    let _tasks_extraInitializers = [];
    var KPI = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.ministry_requirement_id = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _ministry_requirement_id_initializers, void 0));
            // Información del KPI
            this.name = (__runInitializers(this, _ministry_requirement_id_extraInitializers), __runInitializers(this, _name_initializers, void 0)); // "Exactitud en cálculo de salarios"
            this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0)); // Qué mide exactamente
            this.category = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _category_initializers, void 0)); // "accuracy", "efficiency", "compliance", etc.
            // Configuración de evaluación
            this.weight = (__runInitializers(this, _category_extraInitializers), __runInitializers(this, _weight_initializers, void 0)); // Peso en la evaluación (0-100%, suma de todos = 100%)
            this.target_value = (__runInitializers(this, _weight_extraInitializers), __runInitializers(this, _target_value_initializers, void 0)); // Valor objetivo (ej: 95% de exactitud)
            this.minimum_pass_value = (__runInitializers(this, _target_value_extraInitializers), __runInitializers(this, _minimum_pass_value_initializers, void 0)); // Mínimo para pasar (ej: 80%)
            // Umbrales de estado
            this.thresholds = (__runInitializers(this, _minimum_pass_value_extraInitializers), __runInitializers(this, _thresholds_initializers, void 0));
            // Evento que dispara este KPI
            this.prompt_instruction = (__runInitializers(this, _thresholds_extraInitializers), __runInitializers(this, _prompt_instruction_initializers, void 0)); // Instrucción para el prompt de IA
            this.trigger_event = (__runInitializers(this, _prompt_instruction_extraInitializers), __runInitializers(this, _trigger_event_initializers, void 0)); // "salary_calculation_completed", "crisis_resolved", etc.
            this.success_criteria = (__runInitializers(this, _trigger_event_extraInitializers), __runInitializers(this, _success_criteria_initializers, void 0)); // Criterios específicos de éxito
            // Metadata
            this.is_active = (__runInitializers(this, _success_criteria_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.tasks_count = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _tasks_count_initializers, void 0)); // Cantidad de tareas vinculadas
            this.students_achieved = (__runInitializers(this, _tasks_count_extraInitializers), __runInitializers(this, _students_achieved_initializers, void 0)); // Estudiantes que lo alcanzaron
            this.created_at = (__runInitializers(this, _students_achieved_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            // Relations
            this.course = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.ministry_requirement = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _ministry_requirement_initializers, void 0));
            this.tasks = (__runInitializers(this, _ministry_requirement_extraInitializers), __runInitializers(this, _tasks_initializers, void 0));
            __runInitializers(this, _tasks_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "KPI");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _ministry_requirement_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _category_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 50 })];
        _weight_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })];
        _target_value_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 })];
        _minimum_pass_value_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 80 })];
        _thresholds_decorators = [(0, typeorm_1.Column)({ type: 'json', default: JSON.stringify({
                    excellent: 95,
                    good: 85,
                    acceptable: 75,
                    poor: 0
                }) })];
        _prompt_instruction_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _trigger_event_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100 })];
        _success_criteria_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _tasks_count_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _students_achieved_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, course => course.kpis, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _ministry_requirement_decorators = [(0, typeorm_1.ManyToOne)(() => MinistryRequirement_1.MinistryRequirement, req => req.kpis, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'ministry_requirement_id' })];
        _tasks_decorators = [(0, typeorm_1.OneToMany)(() => Task_1.Task, task => task.kpi)];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _ministry_requirement_id_decorators, { kind: "field", name: "ministry_requirement_id", static: false, private: false, access: { has: obj => "ministry_requirement_id" in obj, get: obj => obj.ministry_requirement_id, set: (obj, value) => { obj.ministry_requirement_id = value; } }, metadata: _metadata }, _ministry_requirement_id_initializers, _ministry_requirement_id_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _category_decorators, { kind: "field", name: "category", static: false, private: false, access: { has: obj => "category" in obj, get: obj => obj.category, set: (obj, value) => { obj.category = value; } }, metadata: _metadata }, _category_initializers, _category_extraInitializers);
        __esDecorate(null, null, _weight_decorators, { kind: "field", name: "weight", static: false, private: false, access: { has: obj => "weight" in obj, get: obj => obj.weight, set: (obj, value) => { obj.weight = value; } }, metadata: _metadata }, _weight_initializers, _weight_extraInitializers);
        __esDecorate(null, null, _target_value_decorators, { kind: "field", name: "target_value", static: false, private: false, access: { has: obj => "target_value" in obj, get: obj => obj.target_value, set: (obj, value) => { obj.target_value = value; } }, metadata: _metadata }, _target_value_initializers, _target_value_extraInitializers);
        __esDecorate(null, null, _minimum_pass_value_decorators, { kind: "field", name: "minimum_pass_value", static: false, private: false, access: { has: obj => "minimum_pass_value" in obj, get: obj => obj.minimum_pass_value, set: (obj, value) => { obj.minimum_pass_value = value; } }, metadata: _metadata }, _minimum_pass_value_initializers, _minimum_pass_value_extraInitializers);
        __esDecorate(null, null, _thresholds_decorators, { kind: "field", name: "thresholds", static: false, private: false, access: { has: obj => "thresholds" in obj, get: obj => obj.thresholds, set: (obj, value) => { obj.thresholds = value; } }, metadata: _metadata }, _thresholds_initializers, _thresholds_extraInitializers);
        __esDecorate(null, null, _prompt_instruction_decorators, { kind: "field", name: "prompt_instruction", static: false, private: false, access: { has: obj => "prompt_instruction" in obj, get: obj => obj.prompt_instruction, set: (obj, value) => { obj.prompt_instruction = value; } }, metadata: _metadata }, _prompt_instruction_initializers, _prompt_instruction_extraInitializers);
        __esDecorate(null, null, _trigger_event_decorators, { kind: "field", name: "trigger_event", static: false, private: false, access: { has: obj => "trigger_event" in obj, get: obj => obj.trigger_event, set: (obj, value) => { obj.trigger_event = value; } }, metadata: _metadata }, _trigger_event_initializers, _trigger_event_extraInitializers);
        __esDecorate(null, null, _success_criteria_decorators, { kind: "field", name: "success_criteria", static: false, private: false, access: { has: obj => "success_criteria" in obj, get: obj => obj.success_criteria, set: (obj, value) => { obj.success_criteria = value; } }, metadata: _metadata }, _success_criteria_initializers, _success_criteria_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _tasks_count_decorators, { kind: "field", name: "tasks_count", static: false, private: false, access: { has: obj => "tasks_count" in obj, get: obj => obj.tasks_count, set: (obj, value) => { obj.tasks_count = value; } }, metadata: _metadata }, _tasks_count_initializers, _tasks_count_extraInitializers);
        __esDecorate(null, null, _students_achieved_decorators, { kind: "field", name: "students_achieved", static: false, private: false, access: { has: obj => "students_achieved" in obj, get: obj => obj.students_achieved, set: (obj, value) => { obj.students_achieved = value; } }, metadata: _metadata }, _students_achieved_initializers, _students_achieved_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _ministry_requirement_decorators, { kind: "field", name: "ministry_requirement", static: false, private: false, access: { has: obj => "ministry_requirement" in obj, get: obj => obj.ministry_requirement, set: (obj, value) => { obj.ministry_requirement = value; } }, metadata: _metadata }, _ministry_requirement_initializers, _ministry_requirement_extraInitializers);
        __esDecorate(null, null, _tasks_decorators, { kind: "field", name: "tasks", static: false, private: false, access: { has: obj => "tasks" in obj, get: obj => obj.tasks, set: (obj, value) => { obj.tasks = value; } }, metadata: _metadata }, _tasks_initializers, _tasks_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        KPI = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return KPI = _classThis;
})();
exports.KPI = KPI;
