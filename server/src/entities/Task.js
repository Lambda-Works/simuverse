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
exports.Task = void 0;
const typeorm_1 = require("typeorm");
const Course_1 = require("./Course");
const KPI_1 = require("./KPI");
const Scenario_1 = require("./Scenario");
/**
 * Tareas generadas automáticamente de los KPIs
 * Las tareas le dicen al estudiante: "Practica esto para alcanzar el KPI X"
 *
 * Flujo:
 * 1. Admin sube requisitos ministeriales
 * 2. Sistema extrae KPIs
 * 3. Sistema genera Tasks (simulaciones práctica + evaluación)
 * 4. Estudiante hace Tasks
 * 5. Sistema evalúa si alcanzó KPIs
 */
let Task = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('tasks'), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['kpi_id']), (0, typeorm_1.Index)(['scenario_id']), (0, typeorm_1.Index)(['type']), (0, typeorm_1.Index)(['status'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _kpi_id_decorators;
    let _kpi_id_initializers = [];
    let _kpi_id_extraInitializers = [];
    let _scenario_id_decorators;
    let _scenario_id_initializers = [];
    let _scenario_id_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _type_decorators;
    let _type_initializers = [];
    let _type_extraInitializers = [];
    let _sequence_order_decorators;
    let _sequence_order_initializers = [];
    let _sequence_order_extraInitializers = [];
    let _ai_prompt_config_decorators;
    let _ai_prompt_config_initializers = [];
    let _ai_prompt_config_extraInitializers = [];
    let _evaluation_criteria_decorators;
    let _evaluation_criteria_initializers = [];
    let _evaluation_criteria_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _students_completed_decorators;
    let _students_completed_initializers = [];
    let _students_completed_extraInitializers = [];
    let _average_completion_rate_decorators;
    let _average_completion_rate_initializers = [];
    let _average_completion_rate_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _activated_at_decorators;
    let _activated_at_initializers = [];
    let _activated_at_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _kpi_decorators;
    let _kpi_initializers = [];
    let _kpi_extraInitializers = [];
    let _scenario_decorators;
    let _scenario_initializers = [];
    let _scenario_extraInitializers = [];
    var Task = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.kpi_id = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _kpi_id_initializers, void 0));
            this.scenario_id = (__runInitializers(this, _kpi_id_extraInitializers), __runInitializers(this, _scenario_id_initializers, void 0)); // Escenario asociado (opcional, puede haber multiple scenarios por tarea)
            // Información de la tarea
            this.title = (__runInitializers(this, _scenario_id_extraInitializers), __runInitializers(this, _title_initializers, void 0)); // "Calcular liquidación de sueldo con 95% exactitud"
            this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0)); // Instrucciones para el estudiante
            this.type = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _type_initializers, void 0)); // 'practice' = puede equivocarse, IA enseña | 'evaluation' = debe pasar
            // Secuencia (1º práctica, 2º práctica, 3º evaluación)
            this.sequence_order = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _sequence_order_initializers, void 0));
            // Configuración de IA
            this.ai_prompt_config = (__runInitializers(this, _sequence_order_extraInitializers), __runInitializers(this, _ai_prompt_config_initializers, void 0));
            // Criterios de evaluación
            this.evaluation_criteria = (__runInitializers(this, _ai_prompt_config_extraInitializers), __runInitializers(this, _evaluation_criteria_initializers, void 0));
            // Estado
            this.status = (__runInitializers(this, _evaluation_criteria_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.is_active = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.students_completed = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _students_completed_initializers, void 0)); // Cuántos la completaron
            this.average_completion_rate = (__runInitializers(this, _students_completed_extraInitializers), __runInitializers(this, _average_completion_rate_initializers, void 0)); // % promedio de cumplimiento
            this.created_at = (__runInitializers(this, _average_completion_rate_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.activated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _activated_at_initializers, void 0));
            // Relations
            this.course = (__runInitializers(this, _activated_at_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.kpi = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _kpi_initializers, void 0));
            this.scenario = (__runInitializers(this, _kpi_extraInitializers), __runInitializers(this, _scenario_initializers, void 0));
            __runInitializers(this, _scenario_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Task");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _kpi_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _scenario_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _title_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 20 })];
        _sequence_order_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _ai_prompt_config_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _evaluation_criteria_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _status_decorators = [(0, typeorm_1.Column)({ type: 'varchar', default: 'pending' })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _students_completed_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _average_completion_rate_decorators = [(0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, default: 0 })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _activated_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, course => course.tasks, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _kpi_decorators = [(0, typeorm_1.ManyToOne)(() => KPI_1.KPI, kpi => kpi.tasks, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'kpi_id' })];
        _scenario_decorators = [(0, typeorm_1.ManyToOne)(() => Scenario_1.Scenario, scenario => scenario.tasks, { onDelete: 'SET NULL', nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'scenario_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _kpi_id_decorators, { kind: "field", name: "kpi_id", static: false, private: false, access: { has: obj => "kpi_id" in obj, get: obj => obj.kpi_id, set: (obj, value) => { obj.kpi_id = value; } }, metadata: _metadata }, _kpi_id_initializers, _kpi_id_extraInitializers);
        __esDecorate(null, null, _scenario_id_decorators, { kind: "field", name: "scenario_id", static: false, private: false, access: { has: obj => "scenario_id" in obj, get: obj => obj.scenario_id, set: (obj, value) => { obj.scenario_id = value; } }, metadata: _metadata }, _scenario_id_initializers, _scenario_id_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: obj => "type" in obj, get: obj => obj.type, set: (obj, value) => { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
        __esDecorate(null, null, _sequence_order_decorators, { kind: "field", name: "sequence_order", static: false, private: false, access: { has: obj => "sequence_order" in obj, get: obj => obj.sequence_order, set: (obj, value) => { obj.sequence_order = value; } }, metadata: _metadata }, _sequence_order_initializers, _sequence_order_extraInitializers);
        __esDecorate(null, null, _ai_prompt_config_decorators, { kind: "field", name: "ai_prompt_config", static: false, private: false, access: { has: obj => "ai_prompt_config" in obj, get: obj => obj.ai_prompt_config, set: (obj, value) => { obj.ai_prompt_config = value; } }, metadata: _metadata }, _ai_prompt_config_initializers, _ai_prompt_config_extraInitializers);
        __esDecorate(null, null, _evaluation_criteria_decorators, { kind: "field", name: "evaluation_criteria", static: false, private: false, access: { has: obj => "evaluation_criteria" in obj, get: obj => obj.evaluation_criteria, set: (obj, value) => { obj.evaluation_criteria = value; } }, metadata: _metadata }, _evaluation_criteria_initializers, _evaluation_criteria_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _students_completed_decorators, { kind: "field", name: "students_completed", static: false, private: false, access: { has: obj => "students_completed" in obj, get: obj => obj.students_completed, set: (obj, value) => { obj.students_completed = value; } }, metadata: _metadata }, _students_completed_initializers, _students_completed_extraInitializers);
        __esDecorate(null, null, _average_completion_rate_decorators, { kind: "field", name: "average_completion_rate", static: false, private: false, access: { has: obj => "average_completion_rate" in obj, get: obj => obj.average_completion_rate, set: (obj, value) => { obj.average_completion_rate = value; } }, metadata: _metadata }, _average_completion_rate_initializers, _average_completion_rate_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _activated_at_decorators, { kind: "field", name: "activated_at", static: false, private: false, access: { has: obj => "activated_at" in obj, get: obj => obj.activated_at, set: (obj, value) => { obj.activated_at = value; } }, metadata: _metadata }, _activated_at_initializers, _activated_at_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _kpi_decorators, { kind: "field", name: "kpi", static: false, private: false, access: { has: obj => "kpi" in obj, get: obj => obj.kpi, set: (obj, value) => { obj.kpi = value; } }, metadata: _metadata }, _kpi_initializers, _kpi_extraInitializers);
        __esDecorate(null, null, _scenario_decorators, { kind: "field", name: "scenario", static: false, private: false, access: { has: obj => "scenario" in obj, get: obj => obj.scenario, set: (obj, value) => { obj.scenario = value; } }, metadata: _metadata }, _scenario_initializers, _scenario_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Task = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Task = _classThis;
})();
exports.Task = Task;
