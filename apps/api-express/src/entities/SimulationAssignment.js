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
exports.SimulationAssignment = void 0;
const typeorm_1 = require("typeorm");
/**
 * Asignaciones de simulaciones a alumnos
 * El admin asigna una simulación (curso + escenario) a un alumno
 * Define: cuántos intentos tiene, fechas límite, etc.
 *
 * Regla de Negocio:
 * - max_attempts=N → El alumno puede practicar N veces (PRACTICE)
 * - La evaluación DEFINITIVA es una sola instancia diferente (EVALUATION)
 */
let SimulationAssignment = (() => {
    let _classDecorators = [(0, typeorm_1.Entity)('simulation_assignments')];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _id_decorators;
    let _id_initializers = [];
    let _id_extraInitializers = [];
    let _simulation_id_decorators;
    let _simulation_id_initializers = [];
    let _simulation_id_extraInitializers = [];
    let _student_id_decorators;
    let _student_id_initializers = [];
    let _student_id_extraInitializers = [];
    let _course_id_decorators;
    let _course_id_initializers = [];
    let _course_id_extraInitializers = [];
    let _assigned_by_decorators;
    let _assigned_by_initializers = [];
    let _assigned_by_extraInitializers = [];
    let _start_date_decorators;
    let _start_date_initializers = [];
    let _start_date_extraInitializers = [];
    let _end_date_decorators;
    let _end_date_initializers = [];
    let _end_date_extraInitializers = [];
    let _max_attempts_decorators;
    let _max_attempts_initializers = [];
    let _max_attempts_extraInitializers = [];
    let _status_decorators;
    let _status_initializers = [];
    let _status_extraInitializers = [];
    let _attempts_used_decorators;
    let _attempts_used_initializers = [];
    let _attempts_used_extraInitializers = [];
    let _created_at_decorators;
    let _created_at_initializers = [];
    let _created_at_extraInitializers = [];
    var SimulationAssignment = _classThis = class {
        constructor() {
            this.id = __runInitializers(this, _id_initializers, void 0);
            this.simulation_id = (__runInitializers(this, _id_extraInitializers), __runInitializers(this, _simulation_id_initializers, void 0));
            this.student_id = (__runInitializers(this, _simulation_id_extraInitializers), __runInitializers(this, _student_id_initializers, void 0));
            this.course_id = (__runInitializers(this, _student_id_extraInitializers), __runInitializers(this, _course_id_initializers, void 0));
            this.assigned_by = (__runInitializers(this, _course_id_extraInitializers), __runInitializers(this, _assigned_by_initializers, void 0));
            this.start_date = (__runInitializers(this, _assigned_by_extraInitializers), __runInitializers(this, _start_date_initializers, void 0));
            this.end_date = (__runInitializers(this, _start_date_extraInitializers), __runInitializers(this, _end_date_initializers, void 0));
            this.max_attempts = (__runInitializers(this, _end_date_extraInitializers), __runInitializers(this, _max_attempts_initializers, void 0));
            this.status = (__runInitializers(this, _max_attempts_extraInitializers), __runInitializers(this, _status_initializers, void 0));
            this.attempts_used = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _attempts_used_initializers, void 0));
            this.created_at = (__runInitializers(this, _attempts_used_extraInitializers), __runInitializers(this, _created_at_initializers, void 0));
            __runInitializers(this, _created_at_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "SimulationAssignment");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _id_decorators = [(0, typeorm_1.PrimaryGeneratedColumn)()];
        _simulation_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _student_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _course_id_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _assigned_by_decorators = [(0, typeorm_1.Column)({ type: 'varchar', length: 36 })];
        _start_date_decorators = [(0, typeorm_1.Column)({ type: 'datetime', nullable: true })];
        _end_date_decorators = [(0, typeorm_1.Column)({ type: 'datetime', nullable: true })];
        _max_attempts_decorators = [(0, typeorm_1.Column)({ type: 'int', nullable: true, default: 1 })];
        _status_decorators = [(0, typeorm_1.Column)({
                type: 'enum',
                enum: ['pending', 'in_progress', 'completed', 'expired'],
                default: 'pending'
            })];
        _attempts_used_decorators = [(0, typeorm_1.Column)({ type: 'int', default: 0 })];
        _created_at_decorators = [(0, typeorm_1.CreateDateColumn)()];
        __esDecorate(null, null, _id_decorators, { kind: "field", name: "id", static: false, private: false, access: { has: obj => "id" in obj, get: obj => obj.id, set: (obj, value) => { obj.id = value; } }, metadata: _metadata }, _id_initializers, _id_extraInitializers);
        __esDecorate(null, null, _simulation_id_decorators, { kind: "field", name: "simulation_id", static: false, private: false, access: { has: obj => "simulation_id" in obj, get: obj => obj.simulation_id, set: (obj, value) => { obj.simulation_id = value; } }, metadata: _metadata }, _simulation_id_initializers, _simulation_id_extraInitializers);
        __esDecorate(null, null, _student_id_decorators, { kind: "field", name: "student_id", static: false, private: false, access: { has: obj => "student_id" in obj, get: obj => obj.student_id, set: (obj, value) => { obj.student_id = value; } }, metadata: _metadata }, _student_id_initializers, _student_id_extraInitializers);
        __esDecorate(null, null, _course_id_decorators, { kind: "field", name: "course_id", static: false, private: false, access: { has: obj => "course_id" in obj, get: obj => obj.course_id, set: (obj, value) => { obj.course_id = value; } }, metadata: _metadata }, _course_id_initializers, _course_id_extraInitializers);
        __esDecorate(null, null, _assigned_by_decorators, { kind: "field", name: "assigned_by", static: false, private: false, access: { has: obj => "assigned_by" in obj, get: obj => obj.assigned_by, set: (obj, value) => { obj.assigned_by = value; } }, metadata: _metadata }, _assigned_by_initializers, _assigned_by_extraInitializers);
        __esDecorate(null, null, _start_date_decorators, { kind: "field", name: "start_date", static: false, private: false, access: { has: obj => "start_date" in obj, get: obj => obj.start_date, set: (obj, value) => { obj.start_date = value; } }, metadata: _metadata }, _start_date_initializers, _start_date_extraInitializers);
        __esDecorate(null, null, _end_date_decorators, { kind: "field", name: "end_date", static: false, private: false, access: { has: obj => "end_date" in obj, get: obj => obj.end_date, set: (obj, value) => { obj.end_date = value; } }, metadata: _metadata }, _end_date_initializers, _end_date_extraInitializers);
        __esDecorate(null, null, _max_attempts_decorators, { kind: "field", name: "max_attempts", static: false, private: false, access: { has: obj => "max_attempts" in obj, get: obj => obj.max_attempts, set: (obj, value) => { obj.max_attempts = value; } }, metadata: _metadata }, _max_attempts_initializers, _max_attempts_extraInitializers);
        __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: obj => "status" in obj, get: obj => obj.status, set: (obj, value) => { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
        __esDecorate(null, null, _attempts_used_decorators, { kind: "field", name: "attempts_used", static: false, private: false, access: { has: obj => "attempts_used" in obj, get: obj => obj.attempts_used, set: (obj, value) => { obj.attempts_used = value; } }, metadata: _metadata }, _attempts_used_initializers, _attempts_used_extraInitializers);
        __esDecorate(null, null, _created_at_decorators, { kind: "field", name: "created_at", static: false, private: false, access: { has: obj => "created_at" in obj, get: obj => obj.created_at, set: (obj, value) => { obj.created_at = value; } }, metadata: _metadata }, _created_at_initializers, _created_at_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        SimulationAssignment = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return SimulationAssignment = _classThis;
})();
exports.SimulationAssignment = SimulationAssignment;
