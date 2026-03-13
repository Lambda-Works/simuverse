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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PracticeLogs = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Course_1 = require("./Course");
const SimulationInstance_1 = require("./SimulationInstance");
const crypto_1 = __importDefault(require("crypto"));
let PracticeLogs = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('practice_logs'), (0, typeorm_1.Index)(['student_id', 'course_id']), (0, typeorm_1.Index)(['course_id', 'created_at']), (0, typeorm_1.Index)(['student_id', 'created_at']), (0, typeorm_1.Index)(['integrity_hash'])];
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
    let _simulation_instance_id_decorators;
    let _simulation_instance_id_initializers = [];
    let _simulation_instance_id_extraInitializers = [];
    let _action_type_decorators;
    let _action_type_initializers = [];
    let _action_type_extraInitializers = [];
    let _description_decorators;
    let _description_initializers = [];
    let _description_extraInitializers = [];
    let _metadata_decorators;
    let _metadata_initializers = [];
    let _metadata_extraInitializers = [];
    let _sequence_number_decorators;
    let _sequence_number_initializers = [];
    let _sequence_number_extraInitializers = [];
    let _integrity_hash_decorators;
    let _integrity_hash_initializers = [];
    let _integrity_hash_extraInitializers = [];
    let _previous_hash_decorators;
    let _previous_hash_initializers = [];
    let _previous_hash_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _timestamp_decorators;
    let _timestamp_initializers = [];
    let _timestamp_extraInitializers = [];
    let _docenter_notes_decorators;
    let _docenter_notes_initializers = [];
    let _docenter_notes_extraInitializers = [];
    let _student_decorators;
    let _student_initializers = [];
    let _student_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    let _simulation_instance_decorators;
    let _simulation_instance_initializers = [];
    let _simulation_instance_extraInitializers = [];
    var PracticeLogs = _classThis = class {
        // Compute integrity hash to ensure logs cannot be tampered with
        static computeIntegrityHash(previousHash, student_id, course_id, action_type, timestamp) {
            const data = `${previousHash || ''}${student_id}${course_id}${action_type}${timestamp}`;
            return crypto_1.default.createHash('sha256').update(data).digest('hex');
        }
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.student_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _student_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _student_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.simulation_instance_id = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _simulation_instance_id_initializers, void 0));
            this.action_type = (__runInitializers(this, _simulation_instance_id_extraInitializers), __runInitializers(this, _action_type_initializers, void 0));
            this.description = (__runInitializers(this, _action_type_extraInitializers), __runInitializers(this, _description_initializers, void 0));
            this.metadata = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _metadata_initializers, void 0));
            this.sequence_number = (__runInitializers(this, _metadata_extraInitializers), __runInitializers(this, _sequence_number_initializers, void 0)); // Ensures chronological integrity
            // Integrity hash: SHA256(previousHash + student_id + course_id + action_type + timestamp)
            // This makes logs immutable (cryptographically verifiable)
            this.integrity_hash = (__runInitializers(this, _sequence_number_extraInitializers), __runInitializers(this, _integrity_hash_initializers, void 0));
            this.previous_hash = (__runInitializers(this, _integrity_hash_extraInitializers), __runInitializers(this, _previous_hash_initializers, void 0));
            this.created_at = (__runInitializers(this, _previous_hash_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            // Computed timestamp for Ministry verification (immutable)
            this.timestamp = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _timestamp_initializers, void 0)); // Unix timestamp in milliseconds
            this.docenter_notes = (__runInitializers(this, _timestamp_extraInitializers), __runInitializers(this, _docenter_notes_initializers, void 0)); // Teacher notes during review
            this.student = (__runInitializers(this, _docenter_notes_extraInitializers), __runInitializers(this, _student_initializers, void 0));
            this.course = (__runInitializers(this, _student_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            this.simulation_instance = (__runInitializers(this, _course_extraInitializers), __runInitializers(this, _simulation_instance_initializers, void 0));
            __runInitializers(this, _simulation_instance_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "PracticeLogs");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _student_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _simulation_instance_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid', nullable: true })];
        _action_type_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: [
                    'calculation',
                    'document_upload',
                    'email_read',
                    'email_reply',
                    'message_sent',
                    'decision_made',
                    'case_submitted',
                    'case_approved',
                    'case_rejected',
                    'system_event',
                    'crisis_triggered',
                    'evaluation_completed'
                ]
            })];
        _description_decorators = [(0, typeorm_1.Column)({ type: 'text' })];
        _metadata_decorators = [(0, typeorm_1.Column)({ type: 'json' })];
        _sequence_number_decorators = [(0, typeorm_1.Column)({ type: 'int' })];
        _integrity_hash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 64 })];
        _previous_hash_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _timestamp_decorators = [(0, typeorm_1.Column)({ type: 'bigint' })];
        _docenter_notes_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _student_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, (user) => user.practice_logs), (0, typeorm_1.JoinColumn)({ name: 'student_id' })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        _simulation_instance_decorators = [(0, typeorm_1.ManyToOne)(() => SimulationInstance_1.SimulationInstance, (instance) => instance.logs, { nullable: true }), (0, typeorm_1.JoinColumn)({ name: 'simulation_instance_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _student_id_decorators, { kind: "field", name: "student_id", static: false, private: false, access: { has: obj => "student_id" in obj, get: obj => obj.student_id, set: (obj, value) => { obj.student_id = value; } }, metadata: _metadata }, _student_id_initializers, _student_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _simulation_instance_id_decorators, { kind: "field", name: "simulation_instance_id", static: false, private: false, access: { has: obj => "simulation_instance_id" in obj, get: obj => obj.simulation_instance_id, set: (obj, value) => { obj.simulation_instance_id = value; } }, metadata: _metadata }, _simulation_instance_id_initializers, _simulation_instance_id_extraInitializers);
        __esDecorate(null, null, _action_type_decorators, { kind: "field", name: "action_type", static: false, private: false, access: { has: obj => "action_type" in obj, get: obj => obj.action_type, set: (obj, value) => { obj.action_type = value; } }, metadata: _metadata }, _action_type_initializers, _action_type_extraInitializers);
        __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: obj => "description" in obj, get: obj => obj.description, set: (obj, value) => { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
        __esDecorate(null, null, _metadata_decorators, { kind: "field", name: "metadata", static: false, private: false, access: { has: obj => "metadata" in obj, get: obj => obj.metadata, set: (obj, value) => { obj.metadata = value; } }, metadata: _metadata }, _metadata_initializers, _metadata_extraInitializers);
        __esDecorate(null, null, _sequence_number_decorators, { kind: "field", name: "sequence_number", static: false, private: false, access: { has: obj => "sequence_number" in obj, get: obj => obj.sequence_number, set: (obj, value) => { obj.sequence_number = value; } }, metadata: _metadata }, _sequence_number_initializers, _sequence_number_extraInitializers);
        __esDecorate(null, null, _integrity_hash_decorators, { kind: "field", name: "integrity_hash", static: false, private: false, access: { has: obj => "integrity_hash" in obj, get: obj => obj.integrity_hash, set: (obj, value) => { obj.integrity_hash = value; } }, metadata: _metadata }, _integrity_hash_initializers, _integrity_hash_extraInitializers);
        __esDecorate(null, null, _previous_hash_decorators, { kind: "field", name: "previous_hash", static: false, private: false, access: { has: obj => "previous_hash" in obj, get: obj => obj.previous_hash, set: (obj, value) => { obj.previous_hash = value; } }, metadata: _metadata }, _previous_hash_initializers, _previous_hash_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _timestamp_decorators, { kind: "field", name: "timestamp", static: false, private: false, access: { has: obj => "timestamp" in obj, get: obj => obj.timestamp, set: (obj, value) => { obj.timestamp = value; } }, metadata: _metadata }, _timestamp_initializers, _timestamp_extraInitializers);
        __esDecorate(null, null, _docenter_notes_decorators, { kind: "field", name: "docenter_notes", static: false, private: false, access: { has: obj => "docenter_notes" in obj, get: obj => obj.docenter_notes, set: (obj, value) => { obj.docenter_notes = value; } }, metadata: _metadata }, _docenter_notes_initializers, _docenter_notes_extraInitializers);
        __esDecorate(null, null, _student_decorators, { kind: "field", name: "student", static: false, private: false, access: { has: obj => "student" in obj, get: obj => obj.student, set: (obj, value) => { obj.student = value; } }, metadata: _metadata }, _student_initializers, _student_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, null, _simulation_instance_decorators, { kind: "field", name: "simulation_instance", static: false, private: false, access: { has: obj => "simulation_instance" in obj, get: obj => obj.simulation_instance, set: (obj, value) => { obj.simulation_instance = value; } }, metadata: _metadata }, _simulation_instance_initializers, _simulation_instance_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PracticeLogs = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PracticeLogs = _classThis;
})();
exports.PracticeLogs = PracticeLogs;
