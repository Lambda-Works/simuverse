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
exports.TelemetryLog = exports.ActionType = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Course_1 = require("./Course");
const Simulation_1 = require("./Simulation");
var ActionType;
(function (ActionType) {
    ActionType["USER_INPUT"] = "user_input";
    ActionType["SYSTEM_ACTION"] = "system_action";
    ActionType["AI_RESPONSE"] = "ai_response";
    ActionType["DECISION"] = "decision";
    ActionType["ERROR"] = "error";
    ActionType["STATE_CHANGE"] = "state_change";
})(ActionType || (exports.ActionType = ActionType = {}));
let TelemetryLog = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('telemetry_logs'), (0, typeorm_1.Index)(['simulation_id']), (0, typeorm_1.Index)(['user_id']), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['created_at']), (0, typeorm_1.Index)(['action_type'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _simulation_id_decorators;
    let _simulation_id_initializers = [];
    let _simulation_id_extraInitializers = [];
    let _user_id_decorators;
    let _user_id_initializers = [];
    let _user_id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _action_decorators;
    let _action_initializers = [];
    let _action_extraInitializers = [];
    let _action_type_decorators;
    let _action_type_initializers = [];
    let _action_type_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _response_time_ms_decorators;
    let _response_time_ms_initializers = [];
    let _response_time_ms_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _integrity_hash_decorators;
    let _integrity_hash_initializers = [];
    let _integrity_hash_extraInitializers = [];
    let _simulation_decorators;
    let _simulation_initializers = [];
    let _simulation_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    var TelemetryLog = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.simulation_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _simulation_id_initializers, void 0));
            this.user_id = (__runInitializers(this, _simulation_id_extraInitializers), __runInitializers(this, _user_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _user_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.action = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _action_initializers, void 0));
            this.action_type = (__runInitializers(this, _action_extraInitializers), __runInitializers(this, _action_type_initializers, void 0));
            this.created_at = (__runInitializers(this, _action_type_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.response_time_ms = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _response_time_ms_initializers, void 0));
            this.metadata = (__runInitializers(this, _response_time_ms_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.integrity_hash = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _integrity_hash_initializers, void 0)); // SHA-256 hash for immutability verification
            // Relations
            this.simulation = (__runInitializers(this, _integrity_hash_extraInitializers), __runInitializers(this, _simulation_initializers, void 0));
            this.user = (__runInitializers(this, _simulation_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.course = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            __runInitializers(this, _course_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "TelemetryLog");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _simulation_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _user_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _action_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _action_type_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ActionType
            })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)({ type: 'timestamp', precision: 3 })];
        _response_time_ms_decorators = [(0, typeorm_1.Column)({ type: 'int' })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _integrity_hash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 64 })];
        _simulation_decorators = [(0, typeorm_1.ManyToOne)(() => Simulation_1.Simulation, sim => sim.telemetry_logs, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'simulation_id' })];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, user => user.telemetry_logs, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, course => course.telemetry_logs, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _simulation_id_decorators, { kind: "field", name: "simulation_id", static: false, private: false, access: { has: obj => "simulation_id" in obj, get: obj => obj.simulation_id, set: (obj, value) => { obj.simulation_id = value; } }, metadata: _metadata }, _simulation_id_initializers, _simulation_id_extraInitializers);
        __esDecorate(null, null, _user_id_decorators, { kind: "field", name: "user_id", static: false, private: false, access: { has: obj => "user_id" in obj, get: obj => obj.user_id, set: (obj, value) => { obj.user_id = value; } }, metadata: _metadata }, _user_id_initializers, _user_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _action_decorators, { kind: "field", name: "action", static: false, private: false, access: { has: obj => "action" in obj, get: obj => obj.action, set: (obj, value) => { obj.action = value; } }, metadata: _metadata }, _action_initializers, _action_extraInitializers);
        __esDecorate(null, null, _action_type_decorators, { kind: "field", name: "action_type", static: false, private: false, access: { has: obj => "action_type" in obj, get: obj => obj.action_type, set: (obj, value) => { obj.action_type = value; } }, metadata: _metadata }, _action_type_initializers, _action_type_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _response_time_ms_decorators, { kind: "field", name: "response_time_ms", static: false, private: false, access: { has: obj => "response_time_ms" in obj, get: obj => obj.response_time_ms, set: (obj, value) => { obj.response_time_ms = value; } }, metadata: _metadata }, _response_time_ms_initializers, _response_time_ms_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _integrity_hash_decorators, { kind: "field", name: "integrity_hash", static: false, private: false, access: { has: obj => "integrity_hash" in obj, get: obj => obj.integrity_hash, set: (obj, value) => { obj.integrity_hash = value; } }, metadata: _metadata }, _integrity_hash_initializers, _integrity_hash_extraInitializers);
        __esDecorate(null, null, _simulation_decorators, { kind: "field", name: "simulation", static: false, private: false, access: { has: obj => "simulation" in obj, get: obj => obj.simulation, set: (obj, value) => { obj.simulation = value; } }, metadata: _metadata }, _simulation_initializers, _simulation_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TelemetryLog = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TelemetryLog = _classThis;
})();
exports.TelemetryLog = TelemetryLog;
