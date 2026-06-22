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
exports.Assessment = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Course_1 = require("./Course");
const Simulation_1 = require("./Simulation");
let Assessment = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('assessments'), (0, typeorm_1.Index)(['simulation_id']), (0, typeorm_1.Index)(['user_id']), (0, typeorm_1.Index)(['course_id']), (0, typeorm_1.Index)(['created_at'])];
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
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    let _completed_at_decorators;
    let _completed_at_initializers = [];
    let _completed_at_extraInitializers = [];
    let _kpis_decorators;
    let _kpis_initializers = [];
    let _kpis_extraInitializers = [];
    let _ai_evaluation_decorators;
    let _ai_evaluation_initializers = [];
    let _ai_evaluation_extraInitializers = [];
    let _recommendation_decorators;
    let _recommendation_initializers = [];
    let _recommendation_extraInitializers = [];
    let _digital_signature_decorators;
    let _digital_signature_initializers = [];
    let _digital_signature_extraInitializers = [];
    let _feedback_decorators;
    let _feedback_initializers = [];
    let _feedback_extraInitializers = [];
    let _simulation_decorators;
    let _simulation_initializers = [];
    let _simulation_extraInitializers = [];
    let _user_decorators;
    let _user_initializers = [];
    let _user_extraInitializers = [];
    let _course_decorators;
    let _course_initializers = [];
    let _course_extraInitializers = [];
    var Assessment = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.simulation_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _simulation_id_initializers, void 0));
            this.user_id = (__runInitializers(this, _simulation_id_extraInitializers), __runInitializers(this, _user_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _user_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.created_at = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            this.completed_at = (__runInitializers(this, _created_at_extraInitializers), __runInitializers(this, _completed_at_initializers, void 0));
            this.kpis = (__runInitializers(this, _completed_at_extraInitializers), __runInitializers(this, _kpis_initializers, void 0));
            this.ai_evaluation = (__runInitializers(this, _kpis_extraInitializers), __runInitializers(this, _ai_evaluation_initializers, void 0));
            this.recommendation = (__runInitializers(this, _ai_evaluation_extraInitializers), __runInitializers(this, _recommendation_initializers, void 0));
            this.digital_signature = (__runInitializers(this, _recommendation_extraInitializers), __runInitializers(this, _digital_signature_initializers, void 0)); // HMAC-SHA256 for document authenticity
            this.feedback = (__runInitializers(this, _digital_signature_extraInitializers), __runInitializers(this, _feedback_initializers, void 0));
            // Relations
            this.simulation = (__runInitializers(this, _feedback_extraInitializers), __runInitializers(this, _simulation_initializers, void 0));
            this.user = (__runInitializers(this, _simulation_extraInitializers), __runInitializers(this, _user_initializers, void 0));
            this.course = (__runInitializers(this, _user_extraInitializers), __runInitializers(this, _course_initializers, void 0));
            __runInitializers(this, _course_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Assessment");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)('uuid')];
        _simulation_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _user_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'uuid' })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        _completed_at_decorators = [(0, typeorm_1.Column)({ type: 'timestamp', nullable: true })];
        _kpis_decorators = [(0, typeorm_1.Column)({ type: 'json' })];
        _ai_evaluation_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _recommendation_decorators = [(0, typeorm_1.Column)({ type: 'text', nullable: true })];
        _digital_signature_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 64, nullable: true })];
        _feedback_decorators = [(0, typeorm_1.Column)({ type: 'json', nullable: true })];
        _simulation_decorators = [(0, typeorm_1.ManyToOne)(() => Simulation_1.Simulation, sim => sim.assessments, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'simulation_id' })];
        _user_decorators = [(0, typeorm_1.ManyToOne)(() => User_1.User, user => user.assessments, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'user_id' })];
        _course_decorators = [(0, typeorm_1.ManyToOne)(() => Course_1.Course, course => course.assessments, { onDelete: 'CASCADE' }), (0, typeorm_1.JoinColumn)({ name: 'course_id' })];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _simulation_id_decorators, { kind: "field", name: "simulation_id", static: false, private: false, access: { has: obj => "simulation_id" in obj, get: obj => obj.simulation_id, set: (obj, value) => { obj.simulation_id = value; } }, metadata: _metadata }, _simulation_id_initializers, _simulation_id_extraInitializers);
        __esDecorate(null, null, _user_id_decorators, { kind: "field", name: "user_id", static: false, private: false, access: { has: obj => "user_id" in obj, get: obj => obj.user_id, set: (obj, value) => { obj.user_id = value; } }, metadata: _metadata }, _user_id_initializers, _user_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, null, _completed_at_decorators, { kind: "field", name: "completed_at", static: false, private: false, access: { has: obj => "completed_at" in obj, get: obj => obj.completed_at, set: (obj, value) => { obj.completed_at = value; } }, metadata: _metadata }, _completed_at_initializers, _completed_at_extraInitializers);
        __esDecorate(null, null, _kpis_decorators, { kind: "field", name: "kpis", static: false, private: false, access: { has: obj => "kpis" in obj, get: obj => obj.kpis, set: (obj, value) => { obj.kpis = value; } }, metadata: _metadata }, _kpis_initializers, _kpis_extraInitializers);
        __esDecorate(null, null, _ai_evaluation_decorators, { kind: "field", name: "ai_evaluation", static: false, private: false, access: { has: obj => "ai_evaluation" in obj, get: obj => obj.ai_evaluation, set: (obj, value) => { obj.ai_evaluation = value; } }, metadata: _metadata }, _ai_evaluation_initializers, _ai_evaluation_extraInitializers);
        __esDecorate(null, null, _recommendation_decorators, { kind: "field", name: "recommendation", static: false, private: false, access: { has: obj => "recommendation" in obj, get: obj => obj.recommendation, set: (obj, value) => { obj.recommendation = value; } }, metadata: _metadata }, _recommendation_initializers, _recommendation_extraInitializers);
        __esDecorate(null, null, _digital_signature_decorators, { kind: "field", name: "digital_signature", static: false, private: false, access: { has: obj => "digital_signature" in obj, get: obj => obj.digital_signature, set: (obj, value) => { obj.digital_signature = value; } }, metadata: _metadata }, _digital_signature_initializers, _digital_signature_extraInitializers);
        __esDecorate(null, null, _feedback_decorators, { kind: "field", name: "feedback", static: false, private: false, access: { has: obj => "feedback" in obj, get: obj => obj.feedback, set: (obj, value) => { obj.feedback = value; } }, metadata: _metadata }, _feedback_initializers, _feedback_extraInitializers);
        __esDecorate(null, null, _simulation_decorators, { kind: "field", name: "simulation", static: false, private: false, access: { has: obj => "simulation" in obj, get: obj => obj.simulation, set: (obj, value) => { obj.simulation = value; } }, metadata: _metadata }, _simulation_initializers, _simulation_extraInitializers);
        __esDecorate(null, null, _user_decorators, { kind: "field", name: "user", static: false, private: false, access: { has: obj => "user" in obj, get: obj => obj.user, set: (obj, value) => { obj.user = value; } }, metadata: _metadata }, _user_initializers, _user_extraInitializers);
        __esDecorate(null, null, _course_decorators, { kind: "field", name: "course", static: false, private: false, access: { has: obj => "course" in obj, get: obj => obj.course, set: (obj, value) => { obj.course = value; } }, metadata: _metadata }, _course_initializers, _course_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Assessment = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Assessment = _classThis;
})();
exports.Assessment = Assessment;
