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
exports.Scenario = void 0;
const typeorm_1 = require("typeorm");
const Course_1 = require("./Course");
const SimulationInstance_1 = require("./SimulationInstance");
const Task_1 = require("./Task");
/**
 * Escenarios de Simulación
 *
 * scenario_type: 'practice' = múltiples intentos, para aprender
 *                'evaluation' = una sola oportunidad, calificado
 *
 * Los escenarios están basados en los ejes temáticos exigidos por el
 * Ministerio de Educación, cargados en tech_sheets o eval_criteria del curso.
 */
let Scenario = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('scenarios')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _title_decorators;
    let _title_initializers = [];
    let _title_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _scenario_type_decorators;
    let _scenario_type_initializers = [];
    let _scenario_type_extraInitializers = [];
    let _categories_decorators;
    let _categories_initializers = [];
    let _categories_extraInitializers = [];
    let _difficulty_decorators;
    let _difficulty_initializers = [];
    let _difficulty_extraInitializers = [];
    let _content_decorators;
    let _content_initializers = [];
    let _content_extraInitializers = [];
    let _expected_outcomes_decorators;
    let _expected_outcomes_initializers = [];
    let _expected_outcomes_extraInitializers = [];
    let _is_active_decorators;
    let _is_active_initializers = [];
    let _is_active_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _instances_decorators;
    let _instances_initializers = [];
    let _instances_extraInitializers = [];
    let _tasks_decorators;
    let _tasks_initializers = [];
    let _tasks_extraInitializers = [];
    var Scenario = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.course_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.title = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _title_initializers, void 0));
            this.description = (__runInitializers(this, _title_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.scenario_type = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _scenario_type_initializers, void 0)); // 'practice' | 'evaluation'
            this.categories = (__runInitializers(this, _scenario_type_extraInitializers), __runInitializers(this, _categories_initializers, void 0));
            this.difficulty = (__runInitializers(this, _categories_extraInitializers), __runInitializers(this, _difficulty_initializers, void 0));
            this.content = (__runInitializers(this, _difficulty_extraInitializers), __runInitializers(this, _content_initializers, void 0)); // Contenido del escenario: emails, documentos, planillas, contexto
            this.expected_outcomes = (__runInitializers(this, _content_extraInitializers), __runInitializers(this, _expected_outcomes_initializers, void 0)); // Lo que debe lograr el alumno
            this.is_active = (__runInitializers(this, _expected_outcomes_extraInitializers), __runInitializers(this, _is_active_initializers, void 0));
            this.created_at = (__runInitializers(this, _is_active_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            this.course = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.instances = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _instances_initializers, void 0));
            this.tasks = (__runInitializers(this, _instances_extraInitializers), __runInitializers(this, _tasks_initializers, void 0));
            __runInitializers(this, _tasks_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Scenario");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _title_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _scenario_type_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true })];
        _categories_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _difficulty_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['easy', 'medium', 'hard'],
                default: 'medium'
            })];
        _content_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _expected_outcomes_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _is_active_decorators = [(0, typeorm_1.Column)({ type: 'boolean', default: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, (course) => course.scenarios), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _instances_decorators = [(0, typeorm_1.OneToMany)(() => SimulationInstance_1.SimulationInstance, (instance) => instance.scenario)];
        _tasks_decorators = [(0, typeorm_1.OneToMany)(() => Task_1.Task, task => task.scenario)];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _title_decorators, { kind: "field", name: "title", static: false, private: false, access: { has: obj => "title" in obj, get: obj => obj.title, set: (obj, value) => { obj.title = value; } }, metadata: _metadata }, _title_initializers, _title_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _scenario_type_decorators, { kind: "field", name: "scenario_type", static: false, private: false, access: { has: obj => "scenario_type" in obj, get: obj => obj.scenario_type, set: (obj, value) => { obj.scenario_type = value; } }, metadata: _metadata }, _scenario_type_initializers, _scenario_type_extraInitializers);
        __esDecorate(null, null, _categories_decorators, { kind: "field", name: "categories", static: false, private: false, access: { has: obj => "categories" in obj, get: obj => obj.categories, set: (obj, value) => { obj.categories = value; } }, metadata: _metadata }, _categories_initializers, _categories_extraInitializers);
        __esDecorate(null, null, _difficulty_decorators, { kind: "field", name: "difficulty", static: false, private: false, access: { has: obj => "difficulty" in obj, get: obj => obj.difficulty, set: (obj, value) => { obj.difficulty = value; } }, metadata: _metadata }, _difficulty_initializers, _difficulty_extraInitializers);
        __esDecorate(null, null, _content_decorators, { kind: "field", name: "content", static: false, private: false, access: { has: obj => "content" in obj, get: obj => obj.content, set: (obj, value) => { obj.content = value; } }, metadata: _metadata }, _content_initializers, _content_extraInitializers);
        __esDecorate(null, null, _expected_outcomes_decorators, { kind: "field", name: "expected_outcomes", static: false, private: false, access: { has: obj => "expected_outcomes" in obj, get: obj => obj.expected_outcomes, set: (obj, value) => { obj.expected_outcomes = value; } }, metadata: _metadata }, _expected_outcomes_initializers, _expected_outcomes_extraInitializers);
        __esDecorate(null, null, _is_active_decorators, { kind: "field", name: "is_active", static: false, private: false, access: { has: obj => "is_active" in obj, get: obj => obj.is_active, set: (obj, value) => { obj.is_active = value; } }, metadata: _metadata }, _is_active_initializers, _is_active_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _instances_decorators, { kind: "field", name: "instances", static: false, private: false, access: { has: obj => "instances" in obj, get: obj => obj.instances, set: (obj, value) => { obj.instances = value; } }, metadata: _metadata }, _instances_initializers, _instances_extraInitializers);
        __esDecorate(null, null, _tasks_decorators, { kind: "field", name: "tasks", static: false, private: false, access: { has: obj => "tasks" in obj, get: obj => obj.tasks, set: (obj, value) => { obj.tasks = value; } }, metadata: _metadata }, _tasks_initializers, _tasks_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Scenario = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Scenario = _classThis;
})();
exports.Scenario = Scenario;
