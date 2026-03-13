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
exports.Simulation = exports.SimulationStatus = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Course_1 = require("./Course");
const TelemetryLog_1 = require("./TelemetryLog");
const Assessment_1 = require("./Assessment");
var SimulationStatus;
(function (SimulationStatus) {
    SimulationStatus["NOT_STARTED"] = "not_started";
    SimulationStatus["IN_PROGRESS"] = "active";
    SimulationStatus["PAUSED"] = "paused";
    SimulationStatus["COMPLETED"] = "completed";
    SimulationStatus["ABANDONED"] = "abandoned";
})(SimulationStatus || (exports.SimulationStatus = SimulationStatus = {}));
let Simulation = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('simulations'), (0, typeorm_1.Index)(['user_id']), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['status']), (0, typeorm_1.Index)(['started_at'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _user_id_decorators;
    let _user_id_initializers = [];
    let _user_id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _current_state_decorators;
    let _current_state_initializers = [];
    let _current_state_extraInitializers = [];
    let _progress_percentage_decorators;
    let _progress_percentage_initializers = [];
    let _progress_percentage_extraInitializers = [];
    let _started_at_decorators;
    let _started_at_initializers = [];
    let _started_at_extraInitializers = [];
    let _paused_at_decorators;
    let _paused_at_initializers = [];
    let _paused_at_extraInitializers = [];
    let _completed_at_decorators;
    let _completed_at_initializers = [];
    let _completed_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _telemetry_logs_decorators;
    let _telemetry_logs_initializers = [];
    let _telemetry_logs_extraInitializers = [];
    let _assessments_decorators;
    let _assessments_initializers = [];
    let _assessments_extraInitializers = [];
    var Simulation = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.user_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _user_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _user_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.status = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.current_state = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _current_state_initializers, void 0));
            this.progress_percentage = (__runInitializers(this, _current_state_extraInitializers), __runInitializers(this, _progress_percentage_initializers, void 0));
            this.started_at = (__runInitializers(this, _progress_percentage_extraInitializers), __runInitializers(this, _started_at_initializers, void 0));
            this.paused_at = (__runInitializers(this, _started_at_extraInitializers), __runInitializers(this, _paused_at_initializers, void 0));
            this.completed_at = (__runInitializers(this, _paused_at_extraInitializers), __runInitializers(this, _completed_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _completed_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            // Relations
            this.user = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.course = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.telemetry_logs = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _telemetry_logs_initializers, void 0));
            this.assessments = (__runInitializers(this, _telemetry_logs_extraInitializers), __runInitializers(this, _assessments_initializers, void 0));
            __runInitializers(this, _assessments_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Simulation");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _user_id_decorators = [(0, typeorm_1.Column)({ name: 'student_id', type: 'varchar', length: 36 })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: SimulationStatus,
                default: SimulationStatus.IN_PROGRESS
            })];
        _current_state_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _progress_percentage_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _started_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _paused_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _completed_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, user => user.simulations, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'student_id' })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, course => course.simulations, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _telemetry_logs_decorators = [(0, typeorm_1.OneToMany)(() => TelemetryLog_1.TelemetryLog, log => log.simulation, { cascade: true })];
        _assessments_decorators = [(0, typeorm_1.OneToMany)(() => Assessment_1.Assessment, assessment => assessment.simulation)];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _user_id_decorators, { kind: "field", name: "user_id", static: false, private: false, access: { has: obj => "user_id" in obj, get: obj => obj.user_id, set: (obj, value) => { obj.user_id = value; } }, metadata: _metadata }, _user_id_initializers, _user_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _current_state_decorators, { kind: "field", name: "current_state", static: false, private: false, access: { has: obj => "current_state" in obj, get: obj => obj.current_state, set: (obj, value) => { obj.current_state = value; } }, metadata: _metadata }, _current_state_initializers, _current_state_extraInitializers);
        __esDecorate(null, null, _progress_percentage_decorators, { kind: "field", name: "progress_percentage", static: false, private: false, access: { has: obj => "progress_percentage" in obj, get: obj => obj.progress_percentage, set: (obj, value) => { obj.progress_percentage = value; } }, metadata: _metadata }, _progress_percentage_initializers, _progress_percentage_extraInitializers);
        __esDecorate(null, null, _started_at_decorators, { kind: "field", name: "started_at", static: false, private: false, access: { has: obj => "started_at" in obj, get: obj => obj.started_at, set: (obj, value) => { obj.started_at = value; } }, metadata: _metadata }, _started_at_initializers, _started_at_extraInitializers);
        __esDecorate(null, null, _paused_at_decorators, { kind: "field", name: "paused_at", static: false, private: false, access: { has: obj => "paused_at" in obj, get: obj => obj.paused_at, set: (obj, value) => { obj.paused_at = value; } }, metadata: _metadata }, _paused_at_initializers, _paused_at_extraInitializers);
        __esDecorate(null, null, _completed_at_decorators, { kind: "field", name: "completed_at", static: false, private: false, access: { has: obj => "completed_at" in obj, get: obj => obj.completed_at, set: (obj, value) => { obj.completed_at = value; } }, metadata: _metadata }, _completed_at_initializers, _completed_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _telemetry_logs_decorators, { kind: "field", name: "telemetry_logs", static: false, private: false, access: { has: obj => "telemetry_logs" in obj, get: obj => obj.telemetry_logs, set: (obj, value) => { obj.telemetry_logs = value; } }, metadata: _metadata }, _telemetry_logs_initializers, _telemetry_logs_extraInitializers);
        __esDecorate(null, null, _assessments_decorators, { kind: "field", name: "assessments", static: false, private: false, access: { has: obj => "assessments" in obj, get: obj => obj.assessments, set: (obj, value) => { obj.assessments = value; } }, metadata: _metadata }, _assessments_initializers, _assessments_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Simulation = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Simulation = _classThis;
})();
exports.Simulation = Simulation;
