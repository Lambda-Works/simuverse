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
exports.User = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const Simulation_1 = require("./Simulation");
const TelemetryLog_1 = require("./TelemetryLog");
const Assessment_1 = require("./Assessment");
const SimulationInstance_1 = require("./SimulationInstance");
const PracticeLogs_1 = require("./PracticeLogs");
const MinistryRequirement_1 = require("./MinistryRequirement");
const Notification_1 = require("./Notification");
const FileUpload_1 = require("./FileUpload");
var UserRole;
(function (UserRole) {
    UserRole["STUDENT"] = "student";
    UserRole["TEACHER"] = "teacher";
    UserRole["ADMIN"] = "admin";
    UserRole["MINISTRY"] = "ministerio"; // Changed to match actual database value
})(UserRole || (exports.UserRole = UserRole = {}));
let User = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('users'), (0, typeorm_1.Index)(['email'], { unique: true }), (0, typeorm_1.Index)(['created_at'])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _role_decorators;
    let _role_initializers = [];
    let _role_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _updated_at_decorators;
    let _updated_at_initializers = [];
    let _updated_at_extraInitializers = [];
    let _simulations_decorators;
    let _simulations_initializers = [];
    let _simulations_extraInitializers = [];
    let _simulation_instances_decorators;
    let _simulation_instances_initializers = [];
    let _simulation_instances_extraInitializers = [];
    let _practice_logs_decorators;
    let _practice_logs_initializers = [];
    let _practice_logs_extraInitializers = [];
    let _telemetry_logs_decorators;
    let _telemetry_logs_initializers = [];
    let _telemetry_logs_extraInitializers = [];
    let _assessments_decorators;
    let _assessments_initializers = [];
    let _assessments_extraInitializers = [];
    let _ministry_requirements_uploaded_decorators;
    let _ministry_requirements_uploaded_initializers = [];
    let _ministry_requirements_uploaded_extraInitializers = [];
    let _notifications_received_decorators;
    let _notifications_received_initializers = [];
    let _notifications_received_extraInitializers = [];
    let _file_uploads_decorators;
    let _file_uploads_initializers = [];
    let _file_uploads_extraInitializers = [];
    var User = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.email = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _email_initializers, void 0));
            this.password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
            this.name = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _name_initializers, void 0));
            this.role = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _role_initializers, void 0));
            this.created_at = (__runInitializers(this, _role_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.updated_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _updated_at_initializers, void 0));
            // Relations
            this.simulations = (__runInitializers(this, _updated_at_extraInitializers), __runInitializers(this, _simulations_initializers, void 0));
            this.simulation_instances = (__runInitializers(this, _simulations_extraInitializers), __runInitializers(this, _simulation_instances_initializers, void 0));
            this.practice_logs = (__runInitializers(this, _simulation_instances_extraInitializers), __runInitializers(this, _practice_logs_initializers, void 0));
            this.telemetry_logs = (__runInitializers(this, _practice_logs_extraInitializers), __runInitializers(this, _telemetry_logs_initializers, void 0));
            this.assessments = (__runInitializers(this, _telemetry_logs_extraInitializers), __runInitializers(this, _assessments_initializers, void 0));
            this.ministry_requirements_uploaded = (__runInitializers(this, _assessments_extraInitializers), __runInitializers(this, _ministry_requirements_uploaded_initializers, void 0));
            this.notifications_received = (__runInitializers(this, _ministry_requirements_uploaded_extraInitializers), __runInitializers(this, _notifications_received_initializers, void 0));
            this.file_uploads = (__runInitializers(this, _notifications_received_extraInitializers), __runInitializers(this, _file_uploads_initializers, void 0));
            __runInitializers(this, _file_uploads_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "User");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _email_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true })];
        _password_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'password' })];
        _name_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 255 })];
        _role_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: UserRole,
                default: UserRole.STUDENT
            })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _updated_at_decorators = [(0, typeorm_1.UpdateDateColumn)()];
        _simulations_decorators = [(0, typeorm_1.OneToMany)(() => Simulation_1.Simulation, simulation => simulation.user)];
        _simulation_instances_decorators = [(0, typeorm_1.OneToMany)(() => SimulationInstance_1.SimulationInstance, (instance) => instance.student)];
        _practice_logs_decorators = [(0, typeorm_1.OneToMany)(() => PracticeLogs_1.PracticeLogs, (log) => log.student)];
        _telemetry_logs_decorators = [(0, typeorm_1.OneToMany)(() => TelemetryLog_1.TelemetryLog, log => log.user)];
        _assessments_decorators = [(0, typeorm_1.OneToMany)(() => Assessment_1.Assessment, assessment => assessment.user)];
        _ministry_requirements_uploaded_decorators = [(0, typeorm_1.OneToMany)(() => MinistryRequirement_1.MinistryRequirement, req => req.uploaded_by)];
        _notifications_received_decorators = [(0, typeorm_1.OneToMany)(() => Notification_1.Notification, notif => notif.recipient)];
        _file_uploads_decorators = [(0, typeorm_1.OneToMany)(() => FileUpload_1.FileUpload, file => file.uploaded_by)];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
        __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
        __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
        __esDecorate(null, null, _role_decorators, { kind: "field", name: "role", static: false, private: false, access: { has: obj => "role" in obj, get: obj => obj.role, set: (obj, value) => { obj.role = value; } }, metadata: _metadata }, _role_initializers, _role_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _updated_at_decorators, { kind: "field", name: "updated_at", static: false, private: false, access: { has: obj => "updated_at" in obj, get: obj => obj.updated_at, set: (obj, value) => { obj.updated_at = value; } }, metadata: _metadata }, _updated_at_initializers, _updated_at_extraInitializers);
        __esDecorate(null, null, _simulations_decorators, { kind: "field", name: "simulations", static: false, private: false, access: { has: obj => "simulations" in obj, get: obj => obj.simulations, set: (obj, value) => { obj.simulations = value; } }, metadata: _metadata }, _simulations_initializers, _simulations_extraInitializers);
        __esDecorate(null, null, _simulation_instances_decorators, { kind: "field", name: "simulation_instances", static: false, private: false, access: { has: obj => "simulation_instances" in obj, get: obj => obj.simulation_instances, set: (obj, value) => { obj.simulation_instances = value; } }, metadata: _metadata }, _simulation_instances_initializers, _simulation_instances_extraInitializers);
        __esDecorate(null, null, _practice_logs_decorators, { kind: "field", name: "practice_logs", static: false, private: false, access: { has: obj => "practice_logs" in obj, get: obj => obj.practice_logs, set: (obj, value) => { obj.practice_logs = value; } }, metadata: _metadata }, _practice_logs_initializers, _practice_logs_extraInitializers);
        __esDecorate(null, null, _telemetry_logs_decorators, { kind: "field", name: "telemetry_logs", static: false, private: false, access: { has: obj => "telemetry_logs" in obj, get: obj => obj.telemetry_logs, set: (obj, value) => { obj.telemetry_logs = value; } }, metadata: _metadata }, _telemetry_logs_initializers, _telemetry_logs_extraInitializers);
        __esDecorate(null, null, _assessments_decorators, { kind: "field", name: "assessments", static: false, private: false, access: { has: obj => "assessments" in obj, get: obj => obj.assessments, set: (obj, value) => { obj.assessments = value; } }, metadata: _metadata }, _assessments_initializers, _assessments_extraInitializers);
        __esDecorate(null, null, _ministry_requirements_uploaded_decorators, { kind: "field", name: "ministry_requirements_uploaded", static: false, private: false, access: { has: obj => "ministry_requirements_uploaded" in obj, get: obj => obj.ministry_requirements_uploaded, set: (obj, value) => { obj.ministry_requirements_uploaded = value; } }, metadata: _metadata }, _ministry_requirements_uploaded_initializers, _ministry_requirements_uploaded_extraInitializers);
        __esDecorate(null, null, _notifications_received_decorators, { kind: "field", name: "notifications_received", static: false, private: false, access: { has: obj => "notifications_received" in obj, get: obj => obj.notifications_received, set: (obj, value) => { obj.notifications_received = value; } }, metadata: _metadata }, _notifications_received_initializers, _notifications_received_extraInitializers);
        __esDecorate(null, null, _file_uploads_decorators, { kind: "field", name: "file_uploads", static: false, private: false, access: { has: obj => "file_uploads" in obj, get: obj => obj.file_uploads, set: (obj, value) => { obj.file_uploads = value; } }, metadata: _metadata }, _file_uploads_initializers, _file_uploads_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        User = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return User = _classThis;
})();
exports.User = User;
