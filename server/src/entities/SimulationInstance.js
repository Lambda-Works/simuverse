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
exports.SimulationInstance = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Scenario_1 = require("./Scenario");
const Course_1 = require("./Course");
const PracticeLogs_1 = require("./PracticeLogs");
let SimulationInstance = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('simulation_instances')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _student_id_decorators;
    let _student_id_initializers = [];
    let _student_id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _scenario_id_decorators;
    let _scenario_id_initializers = [];
    let _scenario_id_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _current_state_decorators;
    let _current_state_initializers = [];
    let _current_state_extraInitializers = [];
    let _progress_decorators;
    let _progress_initializers = [];
    let _progress_extraInitializers = [];
    let _performance_metrics_decorators;
    let _performance_metrics_initializers = [];
    let _performance_metrics_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _started_at_decorators;
    let _started_at_initializers = [];
    let _started_at_extraInitializers = [];
    let _completed_at_decorators;
    let _completed_at_initializers = [];
    let _completed_at_extraInitializers = [];
    let _submitted_at_decorators;
    let _submitted_at_initializers = [];
    let _submitted_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _student_decorators;
    let _student_initializers = [];
    let _student_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _scenario_decorators;
    let _scenario_initializers = [];
    let _scenario_extraInitializers = [];
    let _logs_decorators;
    let _logs_initializers = [];
    let _logs_extraInitializers = [];
    var SimulationInstance = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.student_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _student_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _student_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.scenario_id = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _scenario_id_initializers, void 0));
            this.status = (__runInitializers(this, _scenario_id_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.current_state = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _current_state_initializers, void 0));
            this.progress = (__runInitializers(this, _current_state_extraInitializers), __runInitializers(this, _progress_initializers, void 0));
            this.performance_metrics = (__runInitializers(this, _progress_extraInitializers), __runInitializers(this, _performance_metrics_initializers, void 0));
            this.metadata = (__runInitializers(this, _performance_metrics_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.started_at = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _started_at_initializers, void 0));
            this.completed_at = (__runInitializers(this, _started_at_extraInitializers), __runInitializers(this, _completed_at_initializers, void 0));
            this.submitted_at = (__runInitializers(this, _completed_at_extraInitializers), __runInitializers(this, _submitted_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _submitted_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            this.student = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _student_initializers, void 0));
            this.course = (__runInitializers(this, _student_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.scenario = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _scenario_initializers, void 0));
            this.logs = (__runInitializers(this, _scenario_extraInitializers), __runInitializers(this, _logs_initializers, void 0));
            __runInitializers(this, _logs_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "SimulationInstance");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _student_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _scenario_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _status_decorators = [(0, typeorm_1.Column)({ type: 'enum', enum: ['not_started', 'in_progress', 'paused', 'completed', 'failed', 'submitted_for_review'], default: 'not_started' })];
        _current_state_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _progress_decorators = [(0, typeorm_1.Column)({ type: 'float', default: 0 })];
        _performance_metrics_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _started_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _completed_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _submitted_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _student_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.simulation_instances), (0, typeorm_1.JoinColumn)({ name: 'student_id' })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, (course) => course.simulation_instances), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _scenario_decorators = [(0, typeorm_1.ManyToOne)(() => Scenario_1.Scenario, (scenario) => scenario.instances), (0, typeorm_1.JoinColumn)({ name: 'scenario_id' })];
        _logs_decorators = [(0, typeorm_1.OneToMany)(() => PracticeLogs_1.PracticeLogs, (log) => log.simulation_instance)];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _student_id_decorators, { kind: "field", name: "student_id", static: false, private: false, access: { has: obj => "student_id" in obj, get: obj => obj.student_id, set: (obj, value) => { obj.student_id = value; } }, metadata: _metadata }, _student_id_initializers, _student_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _scenario_id_decorators, { kind: "field", name: "scenario_id", static: false, private: false, access: { has: obj => "scenario_id" in obj, get: obj => obj.scenario_id, set: (obj, value) => { obj.scenario_id = value; } }, metadata: _metadata }, _scenario_id_initializers, _scenario_id_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _current_state_decorators, { kind: "field", name: "current_state", static: false, private: false, access: { has: obj => "current_state" in obj, get: obj => obj.current_state, set: (obj, value) => { obj.current_state = value; } }, metadata: _metadata }, _current_state_initializers, _current_state_extraInitializers);
        __esDecorate(null, null, _progress_decorators, { kind: "field", name: "progress", static: false, private: false, access: { has: obj => "progress" in obj, get: obj => obj.progress, set: (obj, value) => { obj.progress = value; } }, metadata: _metadata }, _progress_initializers, _progress_extraInitializers);
        __esDecorate(null, null, _performance_metrics_decorators, { kind: "field", name: "performance_metrics", static: false, private: false, access: { has: obj => "performance_metrics" in obj, get: obj => obj.performance_metrics, set: (obj, value) => { obj.performance_metrics = value; } }, metadata: _metadata }, _performance_metrics_initializers, _performance_metrics_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _started_at_decorators, { kind: "field", name: "started_at", static: false, private: false, access: { has: obj => "started_at" in obj, get: obj => obj.started_at, set: (obj, value) => { obj.started_at = value; } }, metadata: _metadata }, _started_at_initializers, _started_at_extraInitializers);
        __esDecorate(null, null, _completed_at_decorators, { kind: "field", name: "completed_at", static: false, private: false, access: { has: obj => "completed_at" in obj, get: obj => obj.completed_at, set: (obj, value) => { obj.completed_at = value; } }, metadata: _metadata }, _completed_at_initializers, _completed_at_extraInitializers);
        __esDecorate(null, null, _submitted_at_decorators, { kind: "field", name: "submitted_at", static: false, private: false, access: { has: obj => "submitted_at" in obj, get: obj => obj.submitted_at, set: (obj, value) => { obj.submitted_at = value; } }, metadata: _metadata }, _submitted_at_initializers, _submitted_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _student_decorators, { kind: "field", name: "student", static: false, private: false, access: { has: obj => "student" in obj, get: obj => obj.student, set: (obj, value) => { obj.student = value; } }, metadata: _metadata }, _student_initializers, _student_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _scenario_decorators, { kind: "field", name: "scenario", static: false, private: false, access: { has: obj => "scenario" in obj, get: obj => obj.scenario, set: (obj, value) => { obj.scenario = value; } }, metadata: _metadata }, _scenario_initializers, _scenario_extraInitializers);
        __esDecorate(null, null, _logs_decorators, { kind: "field", name: "logs", static: false, private: false, access: { has: obj => "logs" in obj, get: obj => obj.logs, set: (obj, value) => { obj.logs = value; } }, metadata: _metadata }, _logs_initializers, _logs_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SimulationInstance = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SimulationInstance = _classThis;
})();
exports.SimulationInstance = SimulationInstance;
